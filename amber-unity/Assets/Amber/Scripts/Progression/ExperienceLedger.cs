using System;
using UnityEngine;

namespace Amber.Progression
{
    /// <summary>
    /// XP and levels, ported from the prototype: each level needs level*100 XP,
    /// and every level-up hardens you with +10 max HP. Kills grant 30 (bandit) or
    /// 15 (coyote); quests grant 60. A singleton so kills anywhere can report in.
    /// </summary>
    public class ExperienceLedger : MonoBehaviour
    {
        public static ExperienceLedger Instance { get; private set; }

        [SerializeField] int level = 1;
        [SerializeField] int xp = 0;
        [SerializeField] int healthPerLevel = 10;

        public int Level => level;
        public int Xp => xp;
        public int XpToNext => level * 100;

        /// <summary>(level, healthBonus) raised on each level-up.</summary>
        public event Action<int, int> LeveledUp;
        /// <summary>(xp, xpToNext) raised whenever XP changes.</summary>
        public event Action<int, int> XpChanged;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(this); return; }
            Instance = this;
        }

        public void Award(int amount)
        {
            xp += amount;
            while (xp >= XpToNext)
            {
                xp -= XpToNext;
                level++;
                LeveledUp?.Invoke(level, healthPerLevel);
            }
            XpChanged?.Invoke(xp, XpToNext);
        }
    }
}
