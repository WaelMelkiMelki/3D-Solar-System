import * as THREE from 'three';
import { initSetup } from './setup.js';
import { createPlanets } from './planets.js';
import { initInteractions } from './interactions.js';
import { AU_SCALE } from './data/planetsConfig.js';

// --- FONCTIONS PHYSIQUES ---

const toRad = (deg) => deg * (Math.PI / 180);

function solveKepler(M, e, tolerance = 1e-6) {
  let E = M;
  let delta = 1;
  let maxIter = 100;
  let iter = 0;

  while (Math.abs(delta) > tolerance && iter < maxIter) {
    delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E = E - delta;
    iter++;
  }
  return E;
}

(async function main() {
  // 1. Setup
  const {
    scene,
    camera,
    renderer,
    controls,
    composer,
    outlinePass,
    loadTexture,
    settings,
    gui,
    raycaster,
    mouse
  } = initSetup();

  const clock = new THREE.Clock();

  // 2. Création des planètes
  const planetsObj = createPlanets(scene, loadTexture, settings, gui);

  // 3. Configuration GUI
  if (gui) {
    // On réduit un peu le max pour avoir plus de précision à basse vitesse
    gui.add(settings, 'timeScale', 0, 100, 0.1) 
       .name('Jours / Sec')
       .listen();

    gui.add(settings, 'sunIntensity', 1, 10).onChange(value => {
      if (planetsObj.sunMat) planetsObj.sunMat.emissiveIntensity = value;
    });
  }

  // 4. Interactions
  const interactions = initInteractions({
    camera,
    controls,
    raycaster,
    mouse,
    gui,
    settings,
    scene,
    outlinePass,
    planetsObj
  });
  interactions.setupGestureControls();

  // 5. Chargement Modèles Externes
  if (planetsObj.marsMoons) {
    planetsObj.marsMoons.forEach(moon => {
      if (moon.modelPath) {
        planetsObj.loadObject(moon.modelPath, moon.position || 10, moon.scale, function (loadedModel) {
          moon.mesh = loadedModel;
          if (planetsObj.planets.mars && planetsObj.planets.mars.planetSystem) {
            planetsObj.planets.mars.planetSystem.add(moon.mesh);
            moon.mesh.traverse(child => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
          }
        });
      }
    });
  }

  // 6. Astéroïdes
  planetsObj.loadAsteroids('/asteroids/asteroidPack.glb', 1000, 2.2 * AU_SCALE, 3.2 * AU_SCALE);

  // 7. Ombres
  try {
    Object.values(planetsObj.planets).forEach(p => {
      if (p && p.planet) {
        p.planet.castShadow = true;
        p.planet.receiveShadow = true;
      }
      if (p && p.Atmosphere) {
        p.Atmosphere.castShadow = true;
        p.Atmosphere.receiveShadow = true;
      }
      if (p && p.Ring) p.Ring.receiveShadow = true;
    });
  } catch (e) { console.warn(e); }

  let totalSimulatedDays = 0;

  // ====================================================
  // BOUCLE D'ANIMATION
  // ====================================================
  function animate() {
    const dt = clock.getDelta();
    
    // Avancement du temps global (pour les orbites)
    totalSimulatedDays += dt * settings.timeScale;
    const T = totalSimulatedDays / 36525; // Siècles juliens

    // FACTEUR DE CORRECTION VISUELLE
    // Si timeScale est élevé (> 1), on ralentit la rotation sur elle-même 
    // pour éviter l'effet "toupie". On divise par 24 par exemple.
    // Si on veut du "Hard Science", mettre ce facteur à 1.
    const visualRotationSlower = 1 / 20; 

    // A. Rotation du Soleil
    if (planetsObj.sun) {
      const period = planetsObj.sun.config?.physical?.rotationPeriod || 25;
      // Le soleil tourne lentement, on peut garder la vitesse réelle ou la ralentir un peu
      planetsObj.sun.rotateY((dt * settings.timeScale * visualRotationSlower / period) * 2 * Math.PI);
    }

    // B. Mise à jour des Planètes
    const planets = planetsObj.planets;
    Object.values(planets).forEach(planetObj => {
      if (!planetObj || !planetObj.planet) return;

      const planetMesh = planetObj.planet;
      const kepler = planetMesh.keplerData;
      const config = planetObj.config ? planetObj.config.physical : null;

      // 1. Rotation sur elle-même (Corrigée visuellement)
      if (config && config.rotationPeriod) {
        // On applique le facteur 'visualRotationSlower' ici
        const rotationSpeed = (dt * settings.timeScale * visualRotationSlower / config.rotationPeriod) * 2 * Math.PI;
        planetMesh.rotateY(rotationSpeed);
      }
      
      // Atmosphère (légèrement plus rapide que la planète pour effet de vent)
      if (planetObj.Atmosphere && config) {
        const atmosPeriod = config.rotationPeriod;
        const rotationSpeed = (dt * settings.timeScale * visualRotationSlower / atmosPeriod) * 2 * Math.PI * 1.02; 
        planetObj.Atmosphere.rotateY(rotationSpeed);
      }

      // 2. Position Orbitale (RESTE SCIENTIFIQUEMENT EXACTE)
      // On n'applique PAS le ralentissement ici, car l'orbite doit correspondre à la date T
      if (kepler) {
        let L_current = kepler.L + kepler.dL * T;
        const w_bar_rad = kepler.Omega + kepler.w;
        const L_rad = toRad(L_current);
        
        let M = L_rad - w_bar_rad;
        M = M % (2 * Math.PI);
        if (M < 0) M += 2 * Math.PI;

        const E = solveKepler(M, kepler.e);

        const a = kepler.a; 
        const b = a * Math.sqrt(1 - kepler.e * kepler.e);

        const x_orb = a * (Math.cos(E) - kepler.e);
        const z_orb = b * Math.sin(E);

        const vec = new THREE.Vector3(x_orb, 0, z_orb);

        vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), kepler.w);
        vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), kepler.I);
        vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), kepler.Omega);

        planetObj.planet3d.position.copy(vec);
      }
    });

    // C. Lunes (Correction visuelle aussi)
    const updateMoon = (moon) => {
      const mesh = moon.mesh;
      if (!mesh) return;

      if (typeof moon.angle === 'undefined') moon.angle = Math.random() * Math.PI * 2;
      const period = moon.orbitPeriod || 27;
      
      // Orbite de la lune (On garde la vitesse réelle relative à la planète)
      moon.angle += (dt * settings.timeScale / period) * 2 * Math.PI;
      
      const x = moon.orbitRadius * Math.cos(moon.angle);
      const z = moon.orbitRadius * Math.sin(moon.angle);
      
      mesh.position.set(x, 0, z);
      
      // Rotation de la lune sur elle-même (Verrouillage gravitationnel)
      // On applique aussi le ralentissement visuel pour qu'on puisse voir les détails
      mesh.rotateY((dt * settings.timeScale * visualRotationSlower / period) * 2 * Math.PI);
    };

    if (planets.earth && planets.earth.moons) planets.earth.moons.forEach(updateMoon);
    if (planetsObj.marsMoons) planetsObj.marsMoons.forEach(updateMoon);
    if (planetsObj.jupiterMoons) planetsObj.jupiterMoons.forEach(updateMoon);

    // D. Astéroïdes
    if (planetsObj.asteroids) {
      planetsObj.asteroids.forEach(asteroid => {
        const orbitSpeed = 0.0002 * settings.timeScale; 
        const x = asteroid.position.x;
        const z = asteroid.position.z;
        asteroid.position.x = x * Math.cos(orbitSpeed) - z * Math.sin(orbitSpeed);
        asteroid.position.z = x * Math.sin(orbitSpeed) + z * Math.cos(orbitSpeed);
        asteroid.rotation.y += 0.01;
      });
    }

    interactions.updateOnFrame();
    controls.update();
    composer.render();

    requestAnimationFrame(animate);
  }

  animate();
})();