using System;
using UnityEngine;

namespace Amber.Combat
{
    /// <summary>
    /// Shared hit-point pool for any character. Resolves part multipliers, the 2x
    /// headshot crit, and the prototype's gib-chance formula on death:
    ///   gibChance = overkill * 0.035 + force * 0.45
    /// Fires events so brains, HUDs, and progression can react without coupling.
    /// </summary>
    public class Health : MonoBehaviour, IDamageable
    {
        [SerializeField] float maxHealth = 30f;
        [SerializeField] bool hostile = true;

        public float Max => maxHealth;
        public float Current { get; private set; }
        public bool Hostile => hostile;
        public bool IsDead { get; private set; }

        /// <summary>(damage dealt, hit) — raised on every non-lethal hit.</summary>
        public event Action<float, HitInfo> Damaged;
        /// <summary>(hit) — raised once, when this drops to zero.</summary>
        public event Action<HitInfo> Died;

        void Awake() => Current = maxHealth;

        public void Configure(float max, bool isHostile)
        {
            maxHealth = max;
            hostile = isHostile;
            Current = max;
            IsDead = false;
        }

        /// <summary>Level-up hardening: raise max and heal by the same amount (prototype +10/level).</summary>
        public void AddMaxHealth(float amount)
        {
            maxHealth += amount;
            Current = Mathf.Min(maxHealth, Current + amount);
        }

        public void Heal(float amount)
        {
            if (IsDead) return;
            Current = Mathf.Min(maxHealth, Current + amount);
        }

        public void ApplyHit(in HitInfo hit)
        {
            if (IsDead) return;

            float amount = hit.Damage;
            if (hit.Part != null) amount *= hit.Part.DamageMultiplier; // headshot crit lives here

            Current -= amount;

            if (Current > 0f)
            {
                Damaged?.Invoke(amount, hit);
                return;
            }

            float overkill = -Current;
            Die(hit, overkill);
        }

        void Die(in HitInfo hit, float overkill)
        {
            IsDead = true;
            Current = 0f;

            // Prototype dismemberment: headshots always pop the head; heavy overkill
            // or a shotgun blast (force) can tear off extra limbs.
            float gibChance = overkill * 0.035f + hit.Force * 0.45f;
            bool headHit = hit.Part != null && hit.Part.Region == BodyRegion.Head;

            if (headHit || UnityEngine.Random.value < gibChance)
            {
                Vector3 impulse = (hit.Direction + Vector3.up * 0.5f) * (3f + hit.Force * 4f);
                int extra = 1 + UnityEngine.Random.Range(0, 2) + (hit.Force > 0f ? 1 : 0);
                GibParts(hit.Part, extra, impulse);
            }

            Died?.Invoke(hit);
        }

        void GibParts(BodyPart struck, int count, Vector3 impulse)
        {
            var parts = GetComponentsInChildren<BodyPart>();
            if (parts.Length == 0) return;

            // Always try the struck part first, then random others up to count.
            if (struck != null) struck.Gib(impulse);
            int popped = struck != null ? 1 : 0;

            for (int i = 0; i < parts.Length && popped < count; i++)
            {
                if (parts[i] == struck || parts[i].Gibbed) continue;
                if (UnityEngine.Random.value < 0.5f)
                {
                    parts[i].Gib(impulse + UnityEngine.Random.insideUnitSphere);
                    popped++;
                }
            }
        }
    }
}
