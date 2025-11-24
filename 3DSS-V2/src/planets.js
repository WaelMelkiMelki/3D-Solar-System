import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { planetsConfig, AU_SCALE } from './data/planetsConfig.js';

export function createPlanets(scene, loadTexture, settings, gui) {
  
  // Helper: Conversion Degrés -> Radians
  const toRad = (deg) => deg * (Math.PI / 180);

  // Helper: Création d'une planète
  function createPlanet(name, config) {
    const { physical, assets, kepler, moons: moonConfigs } = config;
    let material;

    // --- 1. Gestion des Matériaux ---
    if (name === 'Earth' && assets.customShader) {
      material = new THREE.ShaderMaterial({
        uniforms: {
          dayTexture: { value: loadTexture.load(assets.map) },
          nightTexture: { value: loadTexture.load(assets.nightMap) },
          sunPosition: { value: new THREE.Vector3(0, 0, 0) }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vSunDirection;
          uniform vec3 sunPosition;
          void main() {
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
            vSunDirection = normalize(sunPosition - worldPosition.xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D dayTexture;
          uniform sampler2D nightTexture;
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vSunDirection;
          void main() {
            float intensity = max(dot(vNormal, vSunDirection), 0.0);
            vec4 dayColor = texture2D(dayTexture, vUv);
            vec4 nightColor = texture2D(nightTexture, vUv) * 0.2;
            gl_FragColor = mix(nightColor, dayColor, intensity);
          }
        `
      });
    } else if (name === 'Sun' && assets.emissive) {
      material = new THREE.MeshStandardMaterial({
        emissive: assets.emissiveColor,
        emissiveMap: loadTexture.load(assets.map),
        emissiveIntensity: assets.emissiveIntensity
      });
    } else if (assets.bump) {
      material = new THREE.MeshPhongMaterial({
        map: loadTexture.load(assets.map),
        bumpMap: loadTexture.load(assets.bump),
        bumpScale: 0.7
      });
    } else {
      material = new THREE.MeshPhongMaterial({
        map: loadTexture.load(assets.map)
      });
    }

    // --- 2. Géométrie et Mesh ---
    const geometry = new THREE.SphereGeometry(physical.radius, 32, 20);
    const planet = new THREE.Mesh(geometry, material);
    
    // Conteneur 3D qui sera positionné sur l'orbite
    const planet3d = new THREE.Object3D(); 
    
    // Conteneur interne pour l'inclinaison axiale (tilt) et les lunes
    const planetSystem = new THREE.Group(); 

    // --- 3. Calculs de l'Orbite Képlérienne (PDF Page 4-5) ---
    let orbitLine = null;

    if (kepler) {
      // Paramètres orbitaux
      const a = kepler.a * AU_SCALE; // Demi-grand axe mis à l'échelle
      const e = kepler.e;            // Excentricité
      const I = toRad(kepler.I);     // Inclinaison
      const Omega = toRad(kepler.Omega); // Longitude du nœud ascendant
      // Argument du périhélie (omega = w_bar - Omega)
      const w = toRad(kepler.w_bar - kepler.Omega); 

      // Calcul du demi-petit axe b
      const b = a * Math.sqrt(1 - e * e);

      // Génération des points de l'orbite
      const points = [];
      const segments = 256; // Plus de segments pour une courbe lisse

      for (let i = 0; i <= segments; i++) {
        // Anomalie excentrique E de 0 à 2PI
        const E = (i / segments) * 2 * Math.PI;

        // 1. Coordonnées dans le plan orbital (2D)
        // x = a(cos E - e), y = b sin E
        // Note: Dans Three.js, le plan "plat" est XZ. On utilise Z pour le "y" du PDF.
        const x_orb = a * (Math.cos(E) - e);
        const z_orb = b * Math.sin(E);
        
        const vec = new THREE.Vector3(x_orb, 0, z_orb);

        // 2. Application des Rotations (Matrices R1, R2, R3 du PDF)
        // Ordre inverse des opérations mathématiques pour les vecteurs :
        
        // A. Rotation de l'argument du périhélie (w) autour de Y (axe vertical)
        vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), w);

        // B. Rotation de l'inclinaison (I) autour de X
        vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), I);

        // C. Rotation de la longitude du nœud (Omega) autour de Y
        vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), Omega);

        points.push(vec);
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFFFFFF, 
        transparent: true, 
        opacity: 0.2 
      });
      orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
      scene.add(orbitLine);

      // Stockage des données pour l'animation dans main.js
      planet.keplerData = {
        a: a,
        e: e,
        I: I,
        Omega: Omega,
        w: w,
        L: kepler.L, // Longitude moyenne à J2000
        dL: kepler.dL // Vitesse moyenne
      };
    }

    // Position initiale (sera écrasée par main.js dès la première frame)
    planet.position.set(0, 0, 0);
    
    // Inclinaison de la planète sur elle-même (Axial Tilt)
    planetSystem.rotation.z = toRad(physical.tilt || 0);

    planetSystem.add(planet);

    // --- 4. Anneaux ---
    let Ring;
    if (assets.hasRings) {
      const ringData = assets.rings;
      const RingGeo = new THREE.RingGeometry(ringData.innerRadius, ringData.outerRadius, 64);
      const RingMat = new THREE.MeshStandardMaterial({
        map: loadTexture.load(ringData.texture),
        side: THREE.DoubleSide,
        transparent: true
      });
      Ring = new THREE.Mesh(RingGeo, RingMat);
      Ring.rotation.x = -0.5 * Math.PI; // À plat
      // L'anneau suit le tilt de la planète (déjà dans planetSystem)
      planetSystem.add(Ring);
    }

    // --- 5. Atmosphère ---
    let Atmosphere;
    if (assets.atmosphere) {
      const atmosphereGeom = new THREE.SphereGeometry(physical.radius + 0.15, 32, 20);
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        map: loadTexture.load(assets.atmosphere),
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      Atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial);
      // L'atmosphère est ajoutée à planetSystem pour suivre le tilt
      planetSystem.add(Atmosphere); 
    }

    // --- 6. Lunes ---
    let moons = [];
    if (moonConfigs) {
      moons = moonConfigs.map(moonConfig => {
        const moonObj = { 
          ...moonConfig, 
          angle: Math.random() * Math.PI * 2,
          mesh: null 
        };

        if (moonConfig.modelPath) {
          // Modèle GLTF chargé plus tard
        } else {
          // Lune Mesh Standard
          const moonMaterial = moonConfig.bump 
            ? new THREE.MeshStandardMaterial({
                map: loadTexture.load(moonConfig.texture),
                bumpMap: loadTexture.load(moonConfig.bump),
                bumpScale: 0.5
              })
            : new THREE.MeshStandardMaterial({
                map: loadTexture.load(moonConfig.texture)
              });
          
          const moonGeometry = new THREE.SphereGeometry(moonConfig.size, 32, 20);
          const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
          
          // Position initiale relative
          moonMesh.position.set(moonConfig.orbitRadius, 0, 0);
          planetSystem.add(moonMesh);
          moonObj.mesh = moonMesh;
        }
        return moonObj;
      });
    }

    // --- 7. Lumière Soleil ---
    let pointLight = null;
    if (name === 'Sun' && config.light?.enabled) {
      pointLight = new THREE.PointLight(
        config.light.color,
        config.light.intensity,
        config.light.distance,
        config.light.decay
      );
      scene.add(pointLight);
    }

    planet3d.add(planetSystem);
    scene.add(planet3d);
    
    return { 
      name, 
      planet, 
      planet3d, 
      Atmosphere, 
      moons, 
      planetSystem, 
      Ring,
      pointLight,
      config,
      orbitLine // Référence pour le highlighting
    };
  }

  // --- Initialisation Globale ---
  const celestialBodies = {};
  const raycastTargets = [];
  
  Object.entries(planetsConfig).forEach(([name, config]) => {
    const body = createPlanet(name, config);
    
    if (name === 'Sun') {
      celestialBodies.sun = body.planet;
      celestialBodies.sunMat = body.planet.material;
      celestialBodies.pointLight = body.pointLight;
      celestialBodies.sun.config = config; 
    } else {
      celestialBodies[name.toLowerCase()] = body;
      raycastTargets.push(body.planet);
      if (body.Atmosphere) raycastTargets.push(body.Atmosphere);
    }
  });

  // Références pour compatibilité
  celestialBodies.earthMaterial = celestialBodies.earth?.planet.material;

  // Données pour l'UI
  const planetData = {};
  Object.entries(planetsConfig).forEach(([name, config]) => {
    planetData[name] = config.info;
  });

  // Helpers externes
  function loadObject(path, positionX, scale, callback) {
    const loader = new GLTFLoader();
    loader.load(path, function (gltf) {
      const obj = gltf.scene;
      obj.position.set(positionX, 0, 0);
      obj.scale.set(scale, scale, scale);
      if (callback) callback(obj);
      else scene.add(obj);
    }, undefined, function (error) {
      console.error('Error loading GLTF:', error);
    });
  }

  const asteroids = [];
  function loadAsteroids(path, numberOfAsteroids, minOrbitRadius, maxOrbitRadius) {
    const loader = new GLTFLoader();
    loader.load(path, function (gltf) {
      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          for (let i = 0; i < numberOfAsteroids / 12; i++) {
            const asteroid = child.clone();
            const orbitRadius = THREE.MathUtils.randFloat(minOrbitRadius, maxOrbitRadius);
            const angle = Math.random() * Math.PI * 2;
            const x = orbitRadius * Math.cos(angle);
            const z = orbitRadius * Math.sin(angle);
            
            asteroid.position.set(x, 0, z);
            asteroid.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
            asteroid.rotation.y = Math.random() * Math.PI;
            
            scene.add(asteroid);
            asteroids.push(asteroid);
          }
        }
      });
    }, undefined, console.error);
  }

  const planets = {
    mercury: celestialBodies.mercury,
    venus: celestialBodies.venus,
    earth: celestialBodies.earth,
    mars: celestialBodies.mars,
    jupiter: celestialBodies.jupiter,
    saturn: celestialBodies.saturn,
    uranus: celestialBodies.uranus,
    neptune: celestialBodies.neptune,
    pluto: celestialBodies.pluto
  };

  const jupiterMoons = planets.jupiter?.moons || [];
  const marsMoons = planets.mars?.moons || [];

  return {
    sun: celestialBodies.sun,
    sunMat: celestialBodies.sunMat,
    pointLight: celestialBodies.pointLight,
    earthMaterial: celestialBodies.earthMaterial,
    planets,
    jupiterMoons,
    marsMoons,
    planetData,
    raycastTargets,
    loadObject,
    loadAsteroids,
    asteroids
  };
}