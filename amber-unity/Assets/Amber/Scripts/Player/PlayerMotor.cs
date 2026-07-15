using UnityEngine;

namespace Amber.Player
{
    /// <summary>
    /// Kinematic first-person mover on a CharacterController. Walk/sprint, gravity,
    /// and a simple jump. Deliberately snappy — the prototype's flat glide never
    /// felt like weight, so this adds a little acceleration and a grounded check.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class PlayerMotor : MonoBehaviour
    {
        [Header("Speed")]
        public float walkSpeed = 5.5f;
        public float sprintSpeed = 8.5f;
        public float acceleration = 18f;
        public float jumpHeight = 1.2f;
        public float gravity = -22f;

        CharacterController cc;
        Vector3 velocity;      // horizontal smoothed velocity
        float verticalVel;

        void Awake() => cc = GetComponent<CharacterController>();

        /// <summary>Drive from the input router. move is (strafe, forward) in [-1,1].</summary>
        public void Tick(Vector2 move, bool sprint, bool jump)
        {
            float target = sprint ? sprintSpeed : walkSpeed;
            Vector3 wish = (transform.right * move.x + transform.forward * move.y);
            if (wish.sqrMagnitude > 1f) wish.Normalize();
            wish *= target;

            velocity = Vector3.MoveTowards(velocity, wish, acceleration * Time.deltaTime);

            if (cc.isGrounded)
            {
                if (verticalVel < 0f) verticalVel = -2f; // stick to ground
                if (jump) verticalVel = Mathf.Sqrt(jumpHeight * -2f * gravity);
            }
            verticalVel += gravity * Time.deltaTime;

            Vector3 step = velocity * Time.deltaTime + Vector3.up * verticalVel * Time.deltaTime;
            cc.Move(step);
        }
    }
}
