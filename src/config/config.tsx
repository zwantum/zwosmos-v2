import { Quaternion, Vector3 } from "three";

// Global
export const GLOBAL = {
    INITIAL_CAMERA_MOBILE_POS: new Vector3(0, -12, 5.5), // initial camera position for mobile devices
    INITIAL_CAMERA_DESKTOP_POS: new Vector3(0, -10, 4.5), // initial camera position for desktop devices
    INITIAL_CAMERA_MOBILE_FOV: 100, // initial camera field of view for mobile devices
    INITIAL_CAMERA_DESKTOP_FOV: 75, // initial camera field of view for desktop devices 

    TONE_MAPPING_EXPOSURE: .5, // exposure for tone mapping
}

// SceneManager
export const SCENE_MANAGER = {
    ZOOM_OUT_CAMERA_DATA_DEFAULT: { position: new Vector3(0, 0, 0), quaternion: new Quaternion(0, 0, 0, 1), fov: 75, zoomedIn: false }, // default zoom out camera data for all scenes
    SCENE_ORDER: [ // the order of the scenes, in which they will be loaded and rendered
        'galaxy', 'solarSystemApproach', 'solarSystemRotation',
        'earthApproach', 'earth', 'continent', 'city', 'district', 'room'
    ],
    SCENE_ASSETS: { // used to preload assets
        models: {
            // scenes
            galaxy: {
                galaxy: '/assets/models/galaxy.glb'
            },
            room: {
                room: '/assets/models/room.glb',
                phone: '/assets/models/phone.glb',
                monitor: '/assets/models/monitor.glb',
            }
        },
        textures: {
            // scenes
            galaxy: {
                disc: '/assets/img/discs/disc.png',
            },
            solarSystem: {
                disc: '/assets/img/discs/disc.png',
                smoke: '/assets/img/other/smoke.png',
                sun: '/assets/img/planets/sun.jpg',
                mercury: '/assets/img/planets/mercury.jpg',
                venus: '/assets/img/planets/venus.jpg',
                earth: '/assets/img/planets/earth.jpg',
                earthnight: '/assets/img/planets/earthnight.jpg',
                earthclouds: '/assets/img/planets/earthclouds.jpg',
                mars: '/assets/img/planets/mars.jpg',
                jupiter: '/assets/img/planets/jupiter.jpg',
                saturn: '/assets/img/planets/saturn.jpg',
                saturnring: '/assets/img/planets/saturnring.jpg',
                uranus: '/assets/img/planets/uranus.jpg',
                uranusring: '/assets/img/planets/uranusring.jpg',
                neptune: '/assets/img/planets/neptune.jpg',
            },
            continent: {
                continent: '/assets/img/continent/continent.jpg',
            },
            city: {
                city: '/assets/img/city/city.jpg',
            },
            district: {
                district: '/assets/img/district/district.jpg',
            },
        },
        icons: {
            // zoom progress indicator
            zoomProgressIndicator: {
                galaxy: '/assets/icons/zoom_progress_indicator/galaxy.png',
                solarSystemApproach: '/assets/icons/zoom_progress_indicator/space.png',
                solarSystemRotation: '/assets/icons/zoom_progress_indicator/solarsystem.png',
                earthApproach: '/assets/icons/zoom_progress_indicator/earthapproach.png',
                earth: '/assets/icons/zoom_progress_indicator/earth.png',
                continent: '/assets/icons/zoom_progress_indicator/continent.png',
                city: '/assets/icons/zoom_progress_indicator/city.png',
                district: '/assets/icons/zoom_progress_indicator/district.png',
                room: '/assets/icons/zoom_progress_indicator/room.png',
                // end (last point) - when last scene zoomed in (not a real scene, just visual because the zoom indicator goes below the room)
                end: '/assets/icons/zoom_progress_indicator/pin.png',


                // character icons
                astronaut: '/assets/icons/zoom_progress_indicator/astronaut.png',
                superhero: '/assets/icons/zoom_progress_indicator/superhero.png',
                human: '/assets/icons/zoom_progress_indicator/human.png',
            }
        }
    }
}

// Navigation animation
export const NAVIGATION_ANIMATION = {
    DEFAULT_FRICTION: 0.6, // default friction for the animation (0<x<1, 0 = no friction, 1 = no movement)
    DEFAULT_ACCELERATION: 0.04, // acceleration for the animation (0<x<1, 0 = no acceleration, 1 = instant movement)
    DEFAULT_WHEEL_SENSITIVITY: 1, // wheel sensitivity for the animation (0<x<1, 0 = no sensitivity, 1 = instant movement)
    DEFAULT_TOUCH_SENSITIVITY: 0.3, // touch sensitivity for the animation (0<x<1, 0 = no sensitivity, 1 = instant movement)

    COMPLETION_SENSITIVITY: 0.01, // 0<x<1, more sensitivity = faster switch between animation (condition works earlier)
    ZOOMED_IN_SENSITIVITY_MULTIPLIER: 10, // count as zoomed in (sceneZoomed='in') x times earlier

    VELOCITY_THRESHOLD: 0.000001, // threshold for the velocity (prevent it from stopping completely and follow the object (run timeline onUpdate function))
}

// -- Scenes --
// Galaxy
export const GALAXY = {
    STAR_ZOOM_EFFECT_DISTANCE: 0.25, // maximum distance to the galaxy star when zoomed in (to make zoom in effect) = zoomed in too close to the star - make zoom in effect

    // Solar System Star (the star in the galaxy that will be zoomed in to open solar system)
    SOLAR_SYSTEM_STAR: {
        INIT_POSITION: new Vector3(0.038105392881217164, -2.745814737039023, 0.7172299984047412), // the initial position of the star in the galaxy (manually chosen one from the needed area)
        INIT_SIZE: [0.01, 32, 32] as [number, number, number], // the size of the star
        COLOR: 0xFFFFCC, // white-yellowish color
        CAMERA_OFFSET: new Vector3(0, -0.185, 0.185 / 2), // constant offset between the camera and the target
        SIZE_MIN: 0.01, // minimum size of the star (when zoomed out)
        SIZE_MAX: 15, // maximum size of the star (when zoomed in)
        ZOOMED_IN_FOV: 25 // field of view when zoomed in (to make it take the whole screen)
    }
};
