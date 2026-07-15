using UnityEngine;

namespace Amber.Combat
{
    public enum BodyRegion { Torso, Head, Hat, ArmL, ArmR, LegL, LegR }

    /// <summary>
    /// Tag a collider on a character rig as a hittable body part. The prototype
    /// tagged meshes with a part string and applied a 2x headshot multiplier plus
    /// limb-pop on overkill; this is the Unity equivalent, resolved by raycast.
    /// Put one of these on each limb collider and point Owner at the character root.
    /// </summary>
    public class BodyPart : MonoBehaviour
    {
        public BodyRegion Region = BodyRegion.Torso;

        [Tooltip("Damage multiplier for hits to this region. Head = 2x, matching the prototype crit.")]
        public float DamageMultiplier = 1f;

        [Tooltip("Renderer/segment that detaches when this part is torn off. Optional.")]
        public GameObject Detachable;

        [Tooltip("Root component that owns this part. Auto-found in parents if left empty.")]
        public Health Owner;

        public bool Gibbed { get; private set; }

        void Reset()
        {
            // Sensible defaults so designers barely have to touch the inspector.
            Region = BodyRegion.Torso;
            DamageMultiplier = 1f;
        }

        void Awake()
        {
            if (Owner == null) Owner = GetComponentInParent<Health>();
            switch (Region)
            {
                case BodyRegion.Head: DamageMultiplier = Mathf.Max(DamageMultiplier, 2f); break;
                case BodyRegion.Hat:  DamageMultiplier = Mathf.Max(DamageMultiplier, 1f); break;
            }
        }

        /// <summary>Detach the limb with a little physics, matching the prototype's gib pop.</summary>
        public void Gib(Vector3 impulse)
        {
            if (Gibbed || Detachable == null) return;
            Gibbed = true;

            Detachable.transform.SetParent(null, true);
            var rb = Detachable.GetComponent<Rigidbody>();
            if (rb == null) rb = Detachable.AddComponent<Rigidbody>();
            rb.AddForce(impulse, ForceMode.Impulse);
            rb.AddTorque(Random.insideUnitSphere * 4f, ForceMode.Impulse);

            // Keep the street from becoming a charnel house.
            Object.Destroy(Detachable, 12f);
        }
    }
}
