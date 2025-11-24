// src/data/planetsConfig.js

// Facteur d'échelle pour convertir les Unités Astronomiques (UA) en unités Three.js
// Terre = 1 UA. Si on veut que la Terre soit à 100 unités du centre :
export const AU_SCALE = 100; 

export const planetsConfig = {
  Sun: {
    physical: {
      radius: 697 / 40,
      rotationPeriod: 25, // Jours
    },
    assets: {
      map: '/images/sun.jpg',
      emissive: true,
      emissiveColor: 0xFFF88F,
      emissiveIntensity: 1.9
    },
    light: {
      enabled: true,
      color: 0xFDFFD3,
      intensity: 1200,
      distance: 400,
      decay: 1.4
    },
    info: {
      radius: '695,700 km',
      tilt: '7.25°',
      rotation: '25-35 days',
      orbit: 'N/A',
      distance: '0 km',
      moons: '0',
      description: 'The star at the center of our solar system.'
    }
  },

  Mercury: {
    // Données du PDF Page 6 (J2000)
    kepler: {
      a: 0.38709927,    // Demi-grand axe (UA)
      e: 0.20563593,    // Excentricité
      I: 7.00497902,    // Inclinaison (degrés)
      L: 252.25032350,  // Longitude moyenne (degrés)
      w_bar: 77.45779628, // Longitude du périhélie (degrés)
      Omega: 48.33076593, // Longitude du nœud ascendant (degrés)
      dL: 149472.67411175 // Variation de L par siècle (n)
    },
    physical: {
      radius: 2.4,
      tilt: 0.03,
      rotationPeriod: 58.6
    },
    assets: {
      map: '/images/mercurymap.jpg',
      bump: '/images/mercurybump.jpg'
    },
    info: {
      radius: '2,439.7 km',
      tilt: '0.03°',
      rotation: '58.6 days',
      orbit: '88 days',
      distance: '0.39 AU',
      moons: '0',
      description: 'Smallest planet, closest to the Sun.'
    }
  },

  Venus: {
    kepler: {
      a: 0.72333566,
      e: 0.00677672,
      I: 3.39467605,
      L: 181.97909950,
      w_bar: 131.60246718,
      Omega: 76.67984255,
      dL: 58517.81538729
    },
    physical: {
      radius: 6.1,
      tilt: 177.3,
      rotationPeriod: -243
    },
    assets: {
      map: '/images/venusmap.jpg',
      bump: '/images/venusmap.jpg',
      atmosphere: '/images/venus_atmosphere.jpg'
    },
    info: {
      radius: '6,051.8 km',
      tilt: '177.3°',
      rotation: '-243 days',
      orbit: '225 days',
      distance: '0.72 AU',
      moons: '0',
      description: 'Hottest planet with thick atmosphere.'
    }
  },

  Earth: {
    kepler: {
      a: 1.00000261,
      e: 0.01671123,
      I: 0.00001531, // Le plan de référence est l'écliptique terrestre, donc I ~ 0
      L: 100.46457166,
      w_bar: 102.93768193,
      Omega: 0.0, // Par définition pour la Terre J2000
      dL: 35999.37244981
    },
    physical: {
      radius: 6.4,
      tilt: 23.44,
      rotationPeriod: 1
    },
    assets: {
      map: '/images/earth_daymap.jpg',
      nightMap: '/images/earth_nightmap.jpg',
      atmosphere: '/images/earth_atmosphere.jpg',
      customShader: true
    },
    moons: [
      {
        size: 1.6,
        texture: '/images/moonmap.jpg',
        bump: '/images/moonbump.jpg',
        orbitRadius: 15, // Échelle locale relative à la Terre
        orbitPeriod: 27.3
      }
    ],
    info: {
      radius: '6,371 km',
      tilt: '23.5°',
      rotation: '24 hours',
      orbit: '365.25 days',
      distance: '1.00 AU',
      moons: '1',
      description: 'Our home planet.'
    }
  },

  Mars: {
    kepler: {
      a: 1.52371034,
      e: 0.09339410,
      I: 1.84969142,
      L: -4.55343205, // 355.45 deg
      w_bar: -23.94362959, // 336.06 deg
      Omega: 49.55953891,
      dL: 19140.30268499
    },
    physical: {
      radius: 3.4,
      tilt: 25.19,
      rotationPeriod: 1.03
    },
    assets: {
      map: '/images/marsmap.jpg',
      bump: '/images/marsbump.jpg'
    },
    moons: [
      {
        modelPath: '/images/mars/phobos.glb',
        scale: 0.1,
        orbitRadius: 6,
        orbitPeriod: 0.32
      },
      {
        modelPath: '/images/mars/deimos.glb',
        scale: 0.1,
        orbitRadius: 10,
        orbitPeriod: 1.26
      }
    ],
    info: {
      radius: '3,389.5 km',
      tilt: '25.2°',
      rotation: '1.03 days',
      orbit: '687 days',
      distance: '1.52 AU',
      moons: '2',
      description: 'The Red Planet.'
    }
  },

  Jupiter: {
    kepler: {
      a: 5.20288700,
      e: 0.04838624,
      I: 1.30439695,
      L: 34.39644051,
      w_bar: 14.72847983,
      Omega: 100.47390909,
      dL: 3034.74612775
    },
    physical: {
      radius: 69 / 4,
      tilt: 3.13,
      rotationPeriod: 0.41
    },
    assets: {
      map: '/images/jupiter.jpg'
    },
    moons: [
      { size: 1.6, texture: '/images/jupiterIo.jpg', orbitRadius: 22, orbitPeriod: 1.77 },
      { size: 1.4, texture: '/images/jupiterEuropa.jpg', orbitRadius: 26, orbitPeriod: 3.55 },
      { size: 2, texture: '/images/jupiterGanymede.jpg', orbitRadius: 32, orbitPeriod: 7.15 },
      { size: 1.7, texture: '/images/jupiterCallisto.jpg', orbitRadius: 38, orbitPeriod: 16.69 }
    ],
    info: {
      radius: '69,911 km',
      tilt: '3.1°',
      rotation: '9.9 hours',
      orbit: '11.86 years',
      distance: '5.20 AU',
      moons: '95+',
      description: 'Gas giant, largest planet.'
    }
  },

  Saturn: {
    kepler: {
      a: 9.53667594,
      e: 0.05386179,
      I: 2.48599187,
      L: 49.95424423,
      w_bar: 92.59887831,
      Omega: 113.66242448,
      dL: 1222.49362201
    },
    physical: {
      radius: 58 / 4,
      tilt: 26.73,
      rotationPeriod: 0.45
    },
    assets: {
      map: '/images/saturnmap.jpg',
      hasRings: true,
      rings: {
        innerRadius: 18,
        outerRadius: 29,
        texture: '/images/saturn_ring.png'
      }
    },
    info: {
      radius: '58,232 km',
      tilt: '26.7°',
      rotation: '10.7 hours',
      orbit: '29.45 years',
      distance: '9.54 AU',
      moons: '146+',
      description: 'Famous for its rings.'
    }
  },

  Uranus: {
    kepler: {
      a: 19.18916464,
      e: 0.04725744,
      I: 0.77263783,
      L: 313.23810451,
      w_bar: 170.95427630,
      Omega: 73.98982128,
      dL: 428.48202785
    },
    physical: {
      radius: 25 / 4,
      tilt: 97.77,
      rotationPeriod: -0.72
    },
    assets: {
      map: '/images/uranus.jpg',
      hasRings: true,
      rings: {
        innerRadius: 6,
        outerRadius: 8,
        texture: '/images/uranus_ring.png'
      }
    },
    info: {
      radius: '25,362 km',
      tilt: '97.8°',
      rotation: '17.2 hours',
      orbit: '84 years',
      distance: '19.19 AU',
      moons: '27',
      description: 'Ice giant, rotates on its side.'
    }
  },

  Neptune: {
    kepler: {
      a: 30.06992276,
      e: 0.00859048,
      I: 1.77004347,
      L: -55.12002969, // 304.88 deg
      w_bar: 44.96476227,
      Omega: 131.78422574,
      dL: 218.45945325
    },
    physical: {
      radius: 24 / 4,
      tilt: 28.32,
      rotationPeriod: 0.67
    },
    assets: {
      map: '/images/neptune.jpg'
    },
    info: {
      radius: '24,622 km',
      tilt: '28.3°',
      rotation: '16.1 hours',
      orbit: '165 years',
      distance: '30.07 AU',
      moons: '14',
      description: 'Windiest planet, deep blue.'
    }
  },

  Pluto: {
    // Données approximatives pour Pluton (orbite très inclinée et excentrique)
    kepler: {
      a: 39.48211675,
      e: 0.24882730,
      I: 17.14001206,
      L: 238.92903833,
      w_bar: 224.06891629,
      Omega: 110.30393684,
      dL: 145.20780515
    },
    physical: {
      radius: 3,
      tilt: 122.5,
      rotationPeriod: -6.39
    },
    assets: {
      map: '/images/plutomap.jpg'
    },
    info: {
      radius: '1,188 km',
      tilt: '122.5°',
      rotation: '6.4 days',
      orbit: '248 years',
      distance: '39.48 AU',
      moons: '5',
      description: 'Dwarf planet in the Kuiper belt.'
    }
  }
};