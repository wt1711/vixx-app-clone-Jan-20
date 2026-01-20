import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from 'src/config';

type Particle = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  startX: number;
  startY: number;
};

type ParticleSparklesProps = {
  width: number;
  height: number;
  particleCount?: number;
  color?: string;
};

// Generate a random position around the perimeter of the area
function getRandomEdgePosition(width: number, height: number) {
  const edge = Math.floor(Math.random() * 4);
  const padding = 20; // spawn slightly inside the edges

  switch (edge) {
    case 0: // top
      return { x: padding + Math.random() * (width - padding * 2), y: padding };
    case 1: // right
      return {
        x: width - padding,
        y: padding + Math.random() * (height - padding * 2),
      };
    case 2: // bottom
      return {
        x: padding + Math.random() * (width - padding * 2),
        y: height - padding,
      };
    case 3: // left
    default:
      return {
        x: padding,
        y: padding + Math.random() * (height - padding * 2),
      };
  }
}

export function ParticleSparkles({
  width,
  height,
  particleCount = 8,
  color = colors.transparent.white80,
}: ParticleSparklesProps) {
  const particlesRef = useRef<Particle[]>([]);

  // Create particles once
  const particles = useMemo<Particle[]>(() => {
    if (particlesRef.current.length > 0) {
      return particlesRef.current;
    }

    const newParticles = Array.from({ length: particleCount }, (_, i) => {
      const pos = getRandomEdgePosition(width, height);
      return {
        id: i,
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
        startX: pos.x,
        startY: pos.y,
      };
    });

    particlesRef.current = newParticles;
    return newParticles;
  }, [particleCount, width, height]);

  useEffect(() => {
    const animateParticle = (particle: Particle, index: number) => {
      const delay = index * 500;
      const duration = 2500 + Math.random() * 1500;

      const runAnimation = () => {
        // Get new edge position
        const newPos = getRandomEdgePosition(width, height);
        particle.startX = newPos.x;
        particle.startY = newPos.y;
        particle.x.setValue(0);
        particle.y.setValue(0);
        particle.opacity.setValue(0);
        particle.scale.setValue(0);

        Animated.sequence([
          Animated.delay(delay + Math.random() * 300),
          Animated.parallel([
            // Float upward and drift
            Animated.timing(particle.y, {
              toValue: -20 - Math.random() * 30,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(particle.x, {
              toValue: (Math.random() - 0.5) * 40,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            // Fade in then out
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.9,
                duration: duration * 0.25,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: duration * 0.75,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            // Scale up then down
            Animated.sequence([
              Animated.timing(particle.scale, {
                toValue: 0.6 + Math.random() * 0.4,
                duration: duration * 0.3,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0,
                duration: duration * 0.7,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start(() => {
          runAnimation();
        });
      };

      runAnimation();
    };

    particles.forEach((particle, index) => {
      animateParticle(particle, index);
    });

    return () => {
      particles.forEach(p => {
        p.x.stopAnimation();
        p.y.stopAnimation();
        p.opacity.stopAnimation();
        p.scale.stopAnimation();
      });
    };
  }, [particles, width, height]);

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          marginLeft: -width / 2,
          marginTop: -height / 2,
          left: '50%',
          top: '50%',
        },
      ]}
      pointerEvents="none"
    >
      {particles.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.startX,
              top: particle.startY,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
            },
          ]}
        >
          {/* Sparkle shape - 4-point star */}
          <View style={[styles.sparkleCore, { backgroundColor: color }]} />
          <View style={[styles.sparkleRayH, { backgroundColor: color }]} />
          <View style={[styles.sparkleRayV, { backgroundColor: color }]} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    overflow: 'visible',
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginTop: -6,
  },
  sparkleCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  sparkleRayH: {
    width: 12,
    height: 2,
    borderRadius: 1,
    position: 'absolute',
  },
  sparkleRayV: {
    width: 2,
    height: 12,
    borderRadius: 1,
    position: 'absolute',
  },
});
