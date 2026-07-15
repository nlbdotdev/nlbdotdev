using UnityEngine;

namespace Amber.Weapons
{
    /// <summary>
    /// Tuning for a single weapon. Defaults are baked to match the Three.js
    /// prototype so a fresh scene plays identically before you touch anything.
    /// Serializable so it edits inline in the WeaponController inspector — no
    /// .asset wiring needed to hit Play. Promote to a ScriptableObject later if
    /// you want shared instances across characters.
    /// </summary>
    [System.Serializable]
    public class WeaponData
    {
        public string DisplayName = ".357 REVOLVER";

        [Header("Ballistics")]
        public float Damage = 12f;
        [Tooltip("Pellets per shot. 1 = single slug; 6 = buckshot.")]
        public int Pellets = 1;
        [Tooltip("Extra gib bias passed into HitInfo.Force. Shotgun uses 1.")]
        public float GibForce = 0f;
        [Tooltip("Cone half-angle in degrees. Revolver ~0.7, shotgun ~2.9.")]
        public float SpreadDegrees = 0.7f;
        public float Range = 120f;

        [Header("Magazine")]
        public int MagSize = 6;
        public int Reserve = 48;
        public float FireDelay = 0.45f;
        public float ReloadTime = 1.6f;

        [Header("Feel")]
        [Tooltip("Kick applied to the view punch per shot. Shotgun ~1.6.")]
        public float RecoilKick = 1f;
        public bool Automatic = false;
        public bool OwnedAtStart = true;

        // Runtime state (reset on load; not part of authored tuning).
        [HideInInspector] public bool Owned;
        [HideInInspector] public int MagCurrent;
        [HideInInspector] public int ReserveCurrent;

        /// <summary>Set runtime state from config at load. Locked weapons start empty.</summary>
        public void InitRuntime()
        {
            Owned = OwnedAtStart;
            MagCurrent = Owned ? MagSize : 0;
            ReserveCurrent = Owned ? Reserve : 0;
        }

        /// <summary>Unlock and fully stock this weapon (bought/found).</summary>
        public void Grant()
        {
            Owned = true;
            MagCurrent = MagSize;
            ReserveCurrent = Reserve;
        }

        /// <summary>The prototype's three-gun loadout, spread values converted
        /// from radians to degrees (0.012 rad ~= 0.7 deg, 0.05 rad ~= 2.9 deg).</summary>
        public static WeaponData[] DefaultLoadout()
        {
            return new[]
            {
                new WeaponData {
                    DisplayName = ".357 REVOLVER",
                    Damage = 12f, Pellets = 1, GibForce = 0f, SpreadDegrees = 0.7f,
                    MagSize = 6, Reserve = 48, FireDelay = 0.45f, ReloadTime = 1.6f,
                    RecoilKick = 1f, Automatic = false, OwnedAtStart = true,
                },
                new WeaponData {
                    DisplayName = "COWBOY REPEATER",
                    Damage = 20f, Pellets = 1, GibForce = 0f, SpreadDegrees = 0.35f,
                    MagSize = 7, Reserve = 35, FireDelay = 0.8f, ReloadTime = 2.0f,
                    RecoilKick = 1.1f, Automatic = false, OwnedAtStart = true,
                },
                new WeaponData {
                    DisplayName = "CARAVAN SHOTGUN",
                    Damage = 8f, Pellets = 6, GibForce = 1f, SpreadDegrees = 2.9f,
                    MagSize = 2, Reserve = 8, FireDelay = 0.7f, ReloadTime = 2.4f,
                    RecoilKick = 1.6f, Automatic = false, OwnedAtStart = false,
                },
            };
        }
    }
}
