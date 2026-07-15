using UnityEngine;
using Amber.Weapons;

namespace Amber.Player
{
    /// <summary>
    /// Mouse look with clamped pitch, plus an additive recoil punch read from the
    /// WeaponController. The recoil kicks the camera up and settles — this is the
    /// difference between the prototype's cosmetic gun-nudge and actual gunfeel.
    /// </summary>
    public class PlayerLook : MonoBehaviour
    {
        public Transform body;          // yaw target (the player root)
        [Tooltip("Degrees of rotation per mouse pixel (Input System raw delta).")]
        public float sensitivity = 0.12f;
        public float pitchClamp = 85f;

        [Tooltip("Weapon whose recoil punches the view. Optional.")]
        public WeaponController weapon;
        public float recoilToDegrees = 1.4f;

        float pitch;
        float recoilPitch;

        void Reset()
        {
            body = transform.parent;
        }

        void Start()
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        public void Tick(Vector2 lookDelta)
        {
            if (body != null)
                body.Rotate(Vector3.up, lookDelta.x * sensitivity, Space.Self);

            pitch = Mathf.Clamp(pitch - lookDelta.y * sensitivity, -pitchClamp, pitchClamp);

            // Additive recoil, decays toward zero.
            float targetRecoil = weapon != null ? weapon.RecoilPunch * recoilToDegrees : 0f;
            recoilPitch = Mathf.Lerp(recoilPitch, targetRecoil, 24f * Time.deltaTime);

            transform.localRotation = Quaternion.Euler(pitch - recoilPitch, 0f, 0f);
        }

        public void ToggleCursor(bool locked)
        {
            Cursor.lockState = locked ? CursorLockMode.Locked : CursorLockMode.None;
            Cursor.visible = !locked;
        }
    }
}
