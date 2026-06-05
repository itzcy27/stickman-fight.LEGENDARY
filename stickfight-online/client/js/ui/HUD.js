/**
 * HUD — health bars, energy meters, timer, round pips.
 */
class HUD {
  constructor() {
    this._p1Name  = Utils.qs('#hud-p1-name');
    this._p2Name  = Utils.qs('#hud-p2-name');
    this._hp1     = Utils.qs('#hp-bar-p1');
    this._hp2     = Utils.qs('#hp-bar-p2');
    this._en1     = Utils.qs('#energy-bar-p1');
    this._en2     = Utils.qs('#energy-bar-p2');
    this._ult1    = Utils.qs('#ult-bar-p1');
    this._ult2    = Utils.qs('#ult-bar-p2');
    this._timer   = Utils.qs('#round-timer');
    this._roundLbl= Utils.qs('#round-label');
    this._pips1   = Utils.qs('#pips-p1');
    this._pips2   = Utils.qs('#pips-p2');
    this._maxHp   = [100, 100];
  }

  setPlayers(players) {
    if (!players) return;
    players.forEach((p, i) => {
      this._maxHp[i] = p.maxHp;
      if (i === 0 && this._p1Name) this._p1Name.textContent = p.username || 'P1';
      if (i === 1 && this._p2Name) this._p2Name.textContent = p.username || 'P2';
    });
  }

  update(players, roundTimer, round, roundScores) {
    if (!players) return;
    players.forEach((p, i) => {
      const hpBar  = i === 0 ? this._hp1  : this._hp2;
      const enBar  = i === 0 ? this._en1  : this._en2;
      const ultBar = i === 0 ? this._ult1 : this._ult2;
      if (!hpBar) return;

      const hpPct  = Math.max(0, Math.min(100, (p.hp / (this._maxHp[i] || 100)) * 100));
      const enPct  = Math.max(0, Math.min(100, p.energy || 0));
      const ultPct = Math.max(0, Math.min(100, p.ultimateEnergy || 0));

      hpBar.style.width  = hpPct  + '%';
      enBar.style.width  = enPct  + '%';
      ultBar.style.setProperty('--pct', ultPct + '%');

      // Low HP warning
      hpBar.classList.toggle('low', hpPct < 25);

      // Ult ready glow
      ultBar.classList.toggle('full', ultPct >= 100);
    });

    if (this._timer) {
      const t = Math.max(0, Math.ceil(roundTimer || 0));
      this._timer.textContent = t;
      this._timer.classList.toggle('urgent', t <= 10);
    }

    if (round && this._roundLbl) {
      this._roundLbl.textContent = `ROUND ${round}`;
    }

    if (roundScores && this._pips1) {
      this._updatePips(this._pips1, roundScores[0]);
      this._updatePips(this._pips2, roundScores[1]);
    }
  }

  _updatePips(container, wins) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 2; i++) {
      const pip = document.createElement('div');
      pip.className = 'pip' + (i < wins ? ' filled' : '');
      container.appendChild(pip);
    }
  }

  // Training mode simplified update
  updateTraining(players) {
    const p1hp = Utils.qs('#tr-hp-bar-p1');
    const p2hp = Utils.qs('#tr-hp-bar-p2');
    const p1en = Utils.qs('#tr-energy-p1');
    const p1ult = Utils.qs('#tr-ult-p1');

    if (!players) return;
    const p0 = players[0], p1 = players[1];
    const ch0 = CharacterRegistry.get(p0.characterId);
    const ch1 = CharacterRegistry.get(p1.characterId);

    if (p1hp) p1hp.style.width = (p0.hp / (ch0?.maxHp || 100) * 100) + '%';
    if (p2hp) p2hp.style.width = (p1.hp / (ch1?.maxHp || 100) * 100) + '%';
    if (p1en)  p1en.style.width  = (p0.energy  || 0) + '%';
    if (p1ult) p1ult.style.setProperty('--pct', (p0.ultimateEnergy || 0) + '%');
  }
}

window.HUD = HUD;
