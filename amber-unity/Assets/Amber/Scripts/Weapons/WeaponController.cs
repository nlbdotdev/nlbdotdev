using System;
using UnityEngine;
using Amber.Combat;

namespace Amber.Weapons
{
    /// <summary>
    /// Owns the loadout, fires hitscan shots with per-weapon spread, drives recoil,
    /// and manages reload/switch. This is the heart of "gunfeel" — the whole point
    /// of the Unity move — so recoil is a real view punch you'll wire to the camera
    /// and a viewmodel, not a CSS transform like the prototype.
    /// </summary>
    public class WeaponController : MonoBehaviour
    {
        [Tooltip("Camera the shots originate from. Falls back to Camera.main.")]
        public Camera fireCamera;

        [Tooltip("Layers a shot can hit. Include the character and world layers.")]
        public LayerMask hitMask = ~0;

        [Tooltip("Optional transform that recoil kicks (a viewmodel or camera rig).")]
        public Transform viewmodel;

        [SerializeField] WeaponData[] loadout;

        public int CurrentIndex { get; private set; }
        public WeaponData Current => loadout[CurrentIndex];

        /// <summary>(weapon) raised on draw/switch, so the HUD can refresh.</summary>
        public event Action<WeaponData> WeaponChanged;
        /// <summary>(weapon) raised after any ammo change (fire/reload).</summary>
        public event Action<WeaponData> AmmoChanged;
        /// <summary>(hit) raised for every pellet that connects with an IDamageable.</summary>
        public event Action<HitInfo> HitLanded;

        float fireCooldown;
        float reloadTimer;
        float recoil;          // current view-punch magnitude
        Vector3 viewmodelHome;

        void Reset()
        {
            loadout = WeaponData.DefaultLoadout();
        }

        void Awake()
        {
            if (loadout == null || loadout.Length == 0)
                loadout = WeaponData.DefaultLoadout();
            foreach (var w in loadout) w.InitRuntime();
            if (fireCamera == null) fireCamera = Camera.main;
            if (viewmodel != null) viewmodelHome = viewmodel.localPosition;

            CurrentIndex = 0;
            WeaponChanged?.Invoke(Current);
            AmmoChanged?.Invoke(Current);
        }

        void Update()
        {
            float dt = Time.deltaTime;
            if (fireCooldown > 0f) fireCooldown -= dt;
            if (reloadTimer > 0f)
            {
                reloadTimer -= dt;
                if (reloadTimer <= 0f) FinishReload();
            }

            // Recoil decays like the prototype's `recoil -= dt*6`.
            recoil = Mathf.Max(0f, recoil - dt * 6f);
            if (viewmodel != null)
            {
                viewmodel.localPosition = viewmodelHome + new Vector3(0f, 0f, -recoil * 0.08f);
                viewmodel.localRotation = Quaternion.Euler(-recoil * 14f, 0f, 0f);
            }
        }

        public float RecoilPunch => recoil; // let a camera script read the kick

        public void PullTrigger()
        {
            if (fireCooldown > 0f || reloadTimer > 0f) return;
            var w = Current;
            if (!w.Owned) return;

            if (w.MagCurrent <= 0)
            {
                Reload();
                return;
            }

            Fire(w);
        }

        void Fire(WeaponData w)
        {
            w.MagCurrent--;
            fireCooldown = w.FireDelay;
            recoil = w.RecoilKick;

            var cam = fireCamera != null ? fireCamera : Camera.main;
            if (cam == null) return;

            Vector3 origin = cam.transform.position;
            Vector3 forward = cam.transform.forward;
            float spreadRad = w.SpreadDegrees * Mathf.Deg2Rad;

            for (int p = 0; p < Mathf.Max(1, w.Pellets); p++)
            {
                Vector3 dir = ApplySpread(forward, spreadRad);
                if (Physics.Raycast(origin, dir, out RaycastHit hit, w.Range, hitMask, QueryTriggerInteraction.Ignore))
                {
                    // Small random damage jitter like the prototype (+0..5).
                    float dmg = w.Damage + UnityEngine.Random.Range(0f, 5f);
                    var info = new HitInfo(dmg, hit.point, dir, gameObject) { Force = w.GibForce };
                    info.Part = hit.collider.GetComponentInParent<BodyPart>();

                    var target = hit.collider.GetComponentInParent<IDamageable>();
                    if (target != null && !target.IsDead)
                    {
                        target.ApplyHit(in info);
                        HitLanded?.Invoke(info);
                    }
                }
            }

            AmmoChanged?.Invoke(w);
        }

        static Vector3 ApplySpread(Vector3 forward, float spreadRad)
        {
            if (spreadRad <= 0f) return forward;
            // Random cone: rotate forward by a random small yaw/pitch.
            float yaw = UnityEngine.Random.Range(-spreadRad, spreadRad);
            float pitch = UnityEngine.Random.Range(-spreadRad, spreadRad);
            return (Quaternion.AngleAxis(yaw * Mathf.Rad2Deg, Vector3.up)
                  * Quaternion.AngleAxis(pitch * Mathf.Rad2Deg, Vector3.right)
                  * forward).normalized;
        }

        public void Reload()
        {
            var w = Current;
            if (reloadTimer > 0f) return;
            if (w.MagCurrent >= w.MagSize || w.ReserveCurrent <= 0) return;
            reloadTimer = w.ReloadTime;
        }

        void FinishReload()
        {
            var w = Current;
            int need = w.MagSize - w.MagCurrent;
            int take = Mathf.Min(need, w.ReserveCurrent);
            w.MagCurrent += take;
            w.ReserveCurrent -= take;
            AmmoChanged?.Invoke(w);
        }

        public void SwitchTo(int index)
        {
            if (index < 0 || index >= loadout.Length) return;
            if (index == CurrentIndex) return;
            if (!loadout[index].Owned) return; // locked until acquired

            reloadTimer = 0f;
            CurrentIndex = index;
            WeaponChanged?.Invoke(Current);
            AmmoChanged?.Invoke(Current);
        }

        /// <summary>Unlock a weapon the player buys/finds (e.g. the caravan shotgun).</summary>
        public void Acquire(int index)
        {
            if (index < 0 || index >= loadout.Length) return;
            loadout[index].Grant();
            AmmoChanged?.Invoke(Current);
        }

        public int LoadoutSize => loadout.Length;
        public WeaponData At(int i) => loadout[i];
    }
}
