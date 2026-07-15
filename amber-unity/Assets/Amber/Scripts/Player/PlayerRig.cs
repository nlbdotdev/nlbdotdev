using UnityEngine;
using UnityEngine.InputSystem;
using Amber.Weapons;
using Amber.Combat;

namespace Amber.Player
{
    /// <summary>
    /// Wires input to the motor, look, and weapon each frame. Uses the Input
    /// System's low-level device polling (Keyboard/Mouse.current) so it runs with
    /// zero action-asset setup and works whether the project's input backend ends
    /// up "Input System" or "Both". Add to the player root next to PlayerMotor;
    /// it auto-finds the rest.
    /// </summary>
    [RequireComponent(typeof(PlayerMotor))]
    public class PlayerRig : MonoBehaviour
    {
        [Header("Wiring (auto-found if empty)")]
        public PlayerLook look;
        public WeaponController weapon;
        public Health health;

        [Tooltip("Mouse pixels-to-degrees scale before PlayerLook sensitivity.")]
        public float lookScale = 1f;

        PlayerMotor motor;
        bool paused;

        void Awake()
        {
            motor = GetComponent<PlayerMotor>();
            if (look == null) look = GetComponentInChildren<PlayerLook>();
            if (weapon == null) weapon = GetComponentInChildren<WeaponController>();
            if (health == null) health = GetComponent<Health>();

            if (look != null && weapon != null && look.weapon == null) look.weapon = weapon;
        }

        void Update()
        {
            var kb = Keyboard.current;
            var mouse = Mouse.current;
            if (kb == null) return; // no keyboard bound yet

            if (kb.escapeKey.wasPressedThisFrame)
            {
                paused = !paused;
                if (look != null) look.ToggleCursor(!paused);
            }
            if (paused) return;

            // Look
            if (look != null && mouse != null)
                look.Tick(mouse.delta.ReadValue() * lookScale);

            // Move (WASD)
            float x = (kb.dKey.isPressed ? 1f : 0f) - (kb.aKey.isPressed ? 1f : 0f);
            float y = (kb.wKey.isPressed ? 1f : 0f) - (kb.sKey.isPressed ? 1f : 0f);
            bool sprint = kb.leftShiftKey.isPressed;
            bool jump = kb.spaceKey.wasPressedThisFrame;
            motor.Tick(new Vector2(x, y), sprint, jump);

            // Weapons
            if (weapon != null && mouse != null)
            {
                var w = weapon.Current;
                bool wantFire = w.Automatic ? mouse.leftButton.isPressed : mouse.leftButton.wasPressedThisFrame;
                if (wantFire) weapon.PullTrigger();
                if (kb.rKey.wasPressedThisFrame) weapon.Reload();

                for (int i = 0; i < weapon.LoadoutSize && i < 9; i++)
                    if (DigitPressed(kb, i)) weapon.SwitchTo(i);

                float scroll = mouse.scroll.ReadValue().y;
                if (scroll > 0.5f) weapon.SwitchTo((weapon.CurrentIndex + 1) % weapon.LoadoutSize);
                else if (scroll < -0.5f) weapon.SwitchTo((weapon.CurrentIndex - 1 + weapon.LoadoutSize) % weapon.LoadoutSize);
            }
        }

        static bool DigitPressed(Keyboard kb, int index)
        {
            switch (index)
            {
                case 0: return kb.digit1Key.wasPressedThisFrame;
                case 1: return kb.digit2Key.wasPressedThisFrame;
                case 2: return kb.digit3Key.wasPressedThisFrame;
                case 3: return kb.digit4Key.wasPressedThisFrame;
                case 4: return kb.digit5Key.wasPressedThisFrame;
                case 5: return kb.digit6Key.wasPressedThisFrame;
                case 6: return kb.digit7Key.wasPressedThisFrame;
                case 7: return kb.digit8Key.wasPressedThisFrame;
                case 8: return kb.digit9Key.wasPressedThisFrame;
                default: return false;
            }
        }
    }
}
