using UnityEngine;
using Amber.Combat;
using Amber.Progression;

namespace Amber.NPC
{
    /// <summary>
    /// Lightweight combatant AI, ported from the prototype's wander/chase/shoot/flee
    /// loop. Hostiles close distance and fire hitscan at the player; when hurt badly
    /// non-hostiles flee. Grants XP on death via ExperienceLedger. Kept Characterless
    /// (moves a Rigidbody/Transform) so it works on primitive dummies out of the box.
    /// </summary>
    [RequireComponent(typeof(Health))]
    public class NpcBrain : MonoBehaviour
    {
        public enum State { Idle, Wander, Chase, Attack, Flee, Dead }

        [Header("Targeting")]
        public Transform target;              // usually the player; auto-found by tag
        public float sightRange = 30f;
        public float attackRange = 18f;
        public float keepDistance = 8f;

        [Header("Movement")]
        public float moveSpeed = 3.2f;
        public float wanderRadius = 6f;

        [Header("Combat")]
        public float shotDamage = 8f;
        public float fireInterval = 1.2f;
        public float aimError = 2.5f;         // degrees of inaccuracy
        public int xpReward = 30;             // 30 bandit, 15 coyote

        Health health;
        State state = State.Idle;
        Vector3 home;
        Vector3 wanderGoal;
        float fireTimer;
        float repathTimer;

        void Awake()
        {
            health = GetComponent<Health>();
            health.Died += OnDied;
            health.Damaged += OnDamaged;
            home = transform.position;
            wanderGoal = home;
        }

        void Start()
        {
            if (target == null)
            {
                var p = GameObject.FindGameObjectWithTag("Player");
                if (p != null) target = p.transform;
            }
            state = health.Hostile ? State.Wander : State.Idle;
        }

        void Update()
        {
            if (state == State.Dead) return;
            float dt = Time.deltaTime;
            fireTimer -= dt;
            repathTimer -= dt;

            float dist = target != null
                ? Vector3.Distance(transform.position, target.position)
                : Mathf.Infinity;

            switch (state)
            {
                case State.Idle:
                case State.Wander:
                    Wander();
                    if (health.Hostile && target != null && dist < sightRange) state = State.Chase;
                    break;

                case State.Chase:
                    FaceAndMove(target.position, moveSpeed);
                    if (dist < attackRange) state = State.Attack;
                    else if (dist > sightRange * 1.3f) state = State.Wander;
                    break;

                case State.Attack:
                    if (target == null) { state = State.Wander; break; }
                    FaceTarget(target.position);
                    // Strafe to hold a comfortable range instead of hugging the player.
                    if (dist > keepDistance + 2f) MoveToward(target.position, moveSpeed);
                    else if (dist < keepDistance - 2f) MoveToward(target.position, -moveSpeed * 0.6f);
                    if (dist > attackRange * 1.2f) { state = State.Chase; break; }
                    if (fireTimer <= 0f) Shoot();
                    break;

                case State.Flee:
                    if (target != null) MoveToward(target.position, -moveSpeed * 1.3f);
                    break;
            }
        }

        void Wander()
        {
            if (repathTimer <= 0f || Vector3.Distance(transform.position, wanderGoal) < 1f)
            {
                Vector2 r = Random.insideUnitCircle * wanderRadius;
                wanderGoal = home + new Vector3(r.x, 0f, r.y);
                repathTimer = Random.Range(1.5f, 3.5f);
            }
            FaceAndMove(wanderGoal, moveSpeed * 0.5f);
        }

        void FaceAndMove(Vector3 point, float speed)
        {
            FaceTarget(point);
            MoveToward(point, speed);
        }

        void FaceTarget(Vector3 point)
        {
            Vector3 flat = point - transform.position; flat.y = 0f;
            if (flat.sqrMagnitude < 0.01f) return;
            var rot = Quaternion.LookRotation(flat);
            transform.rotation = Quaternion.Slerp(transform.rotation, rot, 8f * Time.deltaTime);
        }

        void MoveToward(Vector3 point, float speed)
        {
            Vector3 flat = point - transform.position; flat.y = 0f;
            if (flat.sqrMagnitude < 0.01f) return;
            transform.position += flat.normalized * speed * Time.deltaTime;
        }

        void Shoot()
        {
            fireTimer = fireInterval;
            if (target == null) return;

            Vector3 origin = transform.position + Vector3.up * 1.4f;
            Vector3 aim = (target.position + Vector3.up * 0.9f - origin).normalized;
            aim = Quaternion.Euler(
                Random.Range(-aimError, aimError),
                Random.Range(-aimError, aimError), 0f) * aim;

            if (Physics.Raycast(origin, aim, out RaycastHit hit, attackRange * 1.5f))
            {
                var dmg = hit.collider.GetComponentInParent<IDamageable>();
                if (dmg != null && !dmg.IsDead && !ReferenceEquals(dmg, health))
                {
                    var info = new HitInfo(shotDamage, hit.point, aim, gameObject);
                    dmg.ApplyHit(in info);
                }
            }
        }

        void OnDamaged(float amount, HitInfo hit)
        {
            // Non-hostiles bolt when hurt; hostiles that were idling wake up.
            if (!health.Hostile) { state = State.Flee; return; }
            if (state == State.Idle || state == State.Wander) state = State.Chase;
        }

        void OnDied(HitInfo hit)
        {
            state = State.Dead;
            if (ExperienceLedger.Instance != null)
                ExperienceLedger.Instance.Award(xpReward);

            // Ragdoll-lite: drop and fade. Real rigs replace this with a ragdoll.
            foreach (var col in GetComponentsInChildren<Collider>()) col.enabled = false;
            enabled = false;
            Destroy(gameObject, 8f);
        }
    }
}
