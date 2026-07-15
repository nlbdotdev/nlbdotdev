using UnityEngine;
using Amber.Weapons;
using Amber.Combat;
using Amber.Progression;

namespace Amber.World
{
    /// <summary>
    /// Throwaway IMGUI HUD so the sandbox is legible without authoring a Canvas:
    /// crosshair, HP, ammo, level/XP. Amber-on-dark to match the Pip-Boy tone.
    /// The real UI is TextMeshPro/UI Toolkit; this just keeps Slice 0 readable.
    /// </summary>
    public class SandboxHud : MonoBehaviour
    {
        Health playerHealth;
        WeaponController weapon;
        ExperienceLedger xp;
        GUIStyle label, big;
        readonly Color amber = new Color(1f, 0.72f, 0.28f);

        void Start()
        {
            var player = GameObject.FindGameObjectWithTag("Player");
            if (player != null)
            {
                playerHealth = player.GetComponent<Health>();
                weapon = player.GetComponentInChildren<WeaponController>();
            }
            xp = ExperienceLedger.Instance;
        }

        void EnsureStyles()
        {
            if (label != null) return;
            label = new GUIStyle(GUI.skin.label) { fontSize = 16, fontStyle = FontStyle.Bold };
            label.normal.textColor = amber;
            big = new GUIStyle(label) { fontSize = 26 };
        }

        void OnGUI()
        {
            EnsureStyles();

            // Crosshair
            float cx = Screen.width * 0.5f, cy = Screen.height * 0.5f;
            GUI.color = amber;
            GUI.DrawTexture(new Rect(cx - 1, cy - 8, 2, 16), Texture2D.whiteTexture);
            GUI.DrawTexture(new Rect(cx - 8, cy - 1, 16, 2), Texture2D.whiteTexture);
            GUI.color = Color.white;

            GUILayout.BeginArea(new Rect(24, Screen.height - 110, 360, 100));
            if (playerHealth != null)
                GUILayout.Label($"HP  {Mathf.CeilToInt(playerHealth.Current)} / {Mathf.CeilToInt(playerHealth.Max)}", big);
            if (xp != null)
                GUILayout.Label($"LVL {xp.Level}   XP {xp.Xp} / {xp.XpToNext}", label);
            GUILayout.EndArea();

            if (weapon != null)
            {
                var w = weapon.Current;
                GUILayout.BeginArea(new Rect(Screen.width - 320, Screen.height - 90, 300, 80));
                GUILayout.Label(w.DisplayName, label);
                GUILayout.Label($"{w.MagCurrent} / {w.ReserveCurrent}", big);
                GUILayout.EndArea();
            }

            GUILayout.BeginArea(new Rect(24, 20, 520, 90));
            GUILayout.Label("AMBER — Slice 0 sandbox", label);
            GUILayout.Label("WASD move · Shift sprint · Mouse look · LMB fire · R reload · 1/2/3 weapons · Esc cursor", GUI.skin.label);
            GUILayout.EndArea();
        }
    }
}
