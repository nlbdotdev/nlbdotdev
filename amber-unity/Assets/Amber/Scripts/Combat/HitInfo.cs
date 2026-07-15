using UnityEngine;

namespace Amber.Combat
{
    /// <summary>
    /// One resolved hit from a weapon. Carries everything the receiver needs to
    /// decide damage, crits, knockback, and whether a limb tears off.
    /// Mirrors the prototype's opts object ({ part, force, overkill, hitPoint }).
    /// </summary>
    public struct HitInfo
    {
        public float Damage;        // base damage before part multipliers
        public Vector3 Point;       // world-space impact point
        public Vector3 Direction;   // shot travel direction (normalized)
        public BodyPart Part;       // which body part the ray struck (may be null)
        public float Force;         // gib bias: 1 for shotgun, 0 for single slugs
        public GameObject Instigator;

        public HitInfo(float damage, Vector3 point, Vector3 direction, GameObject instigator = null)
        {
            Damage = damage;
            Point = point;
            Direction = direction.normalized;
            Part = null;
            Force = 0f;
            Instigator = instigator;
        }
    }

    /// <summary>Anything that can receive a hit (NPCs, the player, target dummies).</summary>
    public interface IDamageable
    {
        void ApplyHit(in HitInfo hit);
        bool IsDead { get; }
    }
}
