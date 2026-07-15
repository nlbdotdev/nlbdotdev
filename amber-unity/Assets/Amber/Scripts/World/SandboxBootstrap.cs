using UnityEngine;
using UnityEngine.Rendering;
using Amber.Player;
using Amber.Weapons;
using Amber.Combat;
using Amber.NPC;
using Amber.Progression;

namespace Amber.World
{
    /// <summary>
    /// Builds a playable test range at runtime from primitives — ground, cover,
    /// target dummies — and spawns the fully-wired player rig. Drop this on one
    /// empty GameObject in an empty scene and press Play. This is Slice 0's
    /// "gray-box that feels better than the prototype": no scene authoring needed
    /// to start iterating on gunfeel. Replace piece by piece with real content.
    /// </summary>
    public class SandboxBootstrap : MonoBehaviour
    {
        [Header("Range")]
        public int dummyCount = 6;
        public int hostileCount = 3;
        public float rangeRadius = 30f;

        [Header("Materials (optional — auto-created if empty)")]
        public Material groundMat;
        public Material propMat;
        public Material dummyMat;
        public Material hostileMat;

        void Awake()
        {
            EnsureMaterials();
            BuildEnvironment();
            var player = BuildPlayer();
            BuildDummies(player.transform);
            EnsureSystems();
        }

        void EnsureMaterials()
        {
            // Pick the shader that matches the ACTIVE pipeline, so materials never
            // render magenta whether or not a URP asset is assigned in Graphics yet.
            bool urpActive = GraphicsSettings.currentRenderPipeline != null;
            Shader lit = urpActive ? Shader.Find("Universal Render Pipeline/Lit") : Shader.Find("Standard");
            if (lit == null) lit = Shader.Find("Standard"); // last-ditch fallback
            groundMat  = groundMat  ? groundMat  : MakeMat(lit, new Color(0.42f, 0.34f, 0.24f));
            propMat    = propMat    ? propMat    : MakeMat(lit, new Color(0.30f, 0.26f, 0.22f));
            dummyMat   = dummyMat   ? dummyMat   : MakeMat(lit, new Color(0.55f, 0.50f, 0.40f));
            hostileMat = hostileMat ? hostileMat : MakeMat(lit, new Color(0.55f, 0.20f, 0.16f));
        }

        static Material MakeMat(Shader s, Color c)
        {
            var m = new Material(s);
            if (m.HasProperty("_BaseColor")) m.SetColor("_BaseColor", c);
            if (m.HasProperty("_Color")) m.SetColor("_Color", c);
            return m;
        }

        void BuildEnvironment()
        {
            // Amber dusk light, matching the prototype's low sun.
            var sunGo = new GameObject("Sun");
            var sun = sunGo.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = new Color(1f, 0.78f, 0.52f);
            sun.intensity = 1.15f;
            sunGo.transform.rotation = Quaternion.Euler(18f, 40f, 0f);
            RenderSettings.ambientLight = new Color(0.35f, 0.30f, 0.28f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.62f, 0.48f, 0.36f);
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogDensity = 0.006f;

            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Ground";
            ground.transform.localScale = Vector3.one * 20f; // 200m plane
            ground.GetComponent<Renderer>().sharedMaterial = groundMat;

            // Scatter some cover blocks to shoot around.
            for (int i = 0; i < 10; i++)
            {
                var box = GameObject.CreatePrimitive(PrimitiveType.Cube);
                box.name = "Cover_" + i;
                Vector2 r = Random.insideUnitCircle * rangeRadius;
                float h = Random.Range(1.2f, 2.8f);
                box.transform.position = new Vector3(r.x, h * 0.5f, r.y + 6f);
                box.transform.localScale = new Vector3(Random.Range(1.5f, 3f), h, Random.Range(1.5f, 3f));
                box.transform.rotation = Quaternion.Euler(0f, Random.Range(0f, 360f), 0f);
                box.GetComponent<Renderer>().sharedMaterial = propMat;
            }
        }

        GameObject BuildPlayer()
        {
            var root = new GameObject("Player");
            root.tag = "Player";
            root.transform.position = new Vector3(0f, 1f, -12f);

            var cc = root.AddComponent<CharacterController>();
            cc.height = 1.8f; cc.radius = 0.35f; cc.center = new Vector3(0f, 0.9f, 0f);

            var motor = root.AddComponent<PlayerMotor>();
            var health = root.AddComponent<Health>();
            health.Configure(100f, false);

            // Camera at eye height.
            var camGo = new GameObject("PlayerCamera");
            camGo.transform.SetParent(root.transform, false);
            camGo.transform.localPosition = new Vector3(0f, 1.65f, 0f);
            var cam = camGo.AddComponent<Camera>();
            camGo.AddComponent<AudioListener>();
            cam.tag = "MainCamera";
            cam.nearClipPlane = 0.05f;

            var look = camGo.AddComponent<PlayerLook>();
            look.body = root.transform;

            var weapon = camGo.AddComponent<WeaponController>();
            weapon.fireCamera = cam;
            // Hit everything. The shot ray starts inside the player's own capsule,
            // so it never self-hits; a dedicated Player layer comes later.
            weapon.hitMask = ~0;
            look.weapon = weapon;

            var rig = root.AddComponent<PlayerRig>();
            rig.look = look; rig.weapon = weapon; rig.health = health;

            // Sandbox is a gunfeel range: unlock the shotgun so all three are
            // testable. In the real game it stays locked until you buy it.
            weapon.Acquire(2);

            return root;
        }

        void BuildDummies(Transform player)
        {
            for (int i = 0; i < dummyCount; i++)
            {
                bool hostile = i < hostileCount;
                var go = new GameObject((hostile ? "Bandit_" : "Target_") + i);
                Vector2 r = Random.insideUnitCircle.normalized * Random.Range(10f, rangeRadius);
                go.transform.position = new Vector3(r.x, 0f, Mathf.Abs(r.y) + 8f);

                // Simple humanoid: torso capsule + head sphere, each a BodyPart.
                var torso = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                torso.name = "Torso";
                torso.transform.SetParent(go.transform, false);
                torso.transform.localPosition = new Vector3(0f, 1.1f, 0f);
                torso.transform.localScale = new Vector3(0.8f, 0.9f, 0.8f);
                torso.GetComponent<Renderer>().sharedMaterial = hostile ? hostileMat : dummyMat;

                var head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                head.name = "Head";
                head.transform.SetParent(go.transform, false);
                head.transform.localPosition = new Vector3(0f, 2.05f, 0f);
                head.transform.localScale = Vector3.one * 0.5f;
                head.GetComponent<Renderer>().sharedMaterial = hostile ? hostileMat : dummyMat;

                var health = go.AddComponent<Health>();
                health.Configure(hostile ? 30f : 25f, hostile);

                var torsoPart = torso.AddComponent<BodyPart>();
                torsoPart.Region = BodyRegion.Torso; torsoPart.Owner = health;
                torsoPart.Detachable = torso;

                var headPart = head.AddComponent<BodyPart>();
                headPart.Region = BodyRegion.Head; headPart.DamageMultiplier = 2f;
                headPart.Owner = health; headPart.Detachable = head;

                if (hostile)
                {
                    var brain = go.AddComponent<NpcBrain>();
                    brain.target = player;
                    brain.xpReward = 30;
                }
                // Non-hostile targets just stand and take hits — a pure gunfeel range.
            }
        }

        void EnsureSystems()
        {
            if (ExperienceLedger.Instance == null)
                new GameObject("ExperienceLedger").AddComponent<ExperienceLedger>();

            // Level-ups harden the player: +10 max HP and a top-up, per the prototype.
            var player = GameObject.FindGameObjectWithTag("Player");
            var playerHealth = player != null ? player.GetComponent<Health>() : null;
            if (playerHealth != null && ExperienceLedger.Instance != null)
            {
                ExperienceLedger.Instance.LeveledUp += (lvl, bonus) => playerHealth.AddMaxHealth(bonus);
            }

            if (FindFirstObjectByType<SandboxHud>() == null)
                gameObject.AddComponent<SandboxHud>();
        }
    }
}
