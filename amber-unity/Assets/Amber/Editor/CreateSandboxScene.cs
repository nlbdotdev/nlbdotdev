using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using Amber.World;

namespace Amber.EditorTools
{
    /// <summary>
    /// One-click sandbox. Amber ▸ Create Sandbox Scene builds an empty scene with a
    /// single SandboxBootstrap object and saves it to Assets/Amber/Scenes/Sandbox.unity.
    /// The bootstrap constructs the whole playable range at runtime, so there's
    /// nothing else to wire — open the scene and press Play.
    /// </summary>
    public static class CreateSandboxScene
    {
        const string ScenePath = "Assets/Amber/Scenes/Sandbox.unity";

        [MenuItem("Amber/Create Sandbox Scene")]
        public static void Create()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var go = new GameObject("SandboxBootstrap");
            go.AddComponent<SandboxBootstrap>();

            System.IO.Directory.CreateDirectory("Assets/Amber/Scenes");
            EditorSceneManager.SaveScene(scene, ScenePath);

            AddToBuildSettings(ScenePath);

            EditorUtility.DisplayDialog("Amber",
                "Sandbox scene created at:\n" + ScenePath +
                "\n\nPress Play to drop into the gray-box range.", "Nice");
        }

        static void AddToBuildSettings(string path)
        {
            var scenes = new System.Collections.Generic.List<EditorBuildSettingsScene>(EditorBuildSettings.scenes);
            if (!scenes.Exists(s => s.path == path))
            {
                scenes.Insert(0, new EditorBuildSettingsScene(path, true));
                EditorBuildSettings.scenes = scenes.ToArray();
            }
        }
    }
}
