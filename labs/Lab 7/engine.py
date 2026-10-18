import numpy as np

class Body:
    def __init__(self, mass, pos, vel, radius=0.1, I=None):
        self.m = mass
        self.r = np.array(pos, dtype=float)
        self.v = np.array(vel, dtype=float)
        self.radius = radius
        self.theta = 0.0      # orientation
        self.omega = 0.0      # angular velocity
        self.I = I if I is not None else 0.5*mass*radius**2
        self.force = np.zeros(2)   # accumulator, reset each step
        self.torque = 0.0

    def clear_accumulators(self):
        self.force = np.zeros(2)
        self.torque = 0.0

class Gravity:
    def __init__(self, g=9.81):
        self.g = np.array([0.0, -g])
    def apply(self, world):
        for b in world.bodies:
            b.force += b.m * self.g        # F = mg

class Drag:
    def __init__(self, c):
        self.c = c
    def apply(self, world):
        for b in world.bodies:
            b.force += -self.c * np.linalg.norm(b.v) * b.v   # quadratic drag

class EulerCromer:
    def step(self, world, dt):
        for b in world.bodies:
            a = b.force / b.m
            b.v += a * dt
            b.r += b.v * dt
            alpha = b.torque / b.I
            b.omega += alpha * dt
            b.theta += b.omega * dt

class World:
    def __init__(self, integrator):
        self.bodies = []
        self.forces = []
        self.integrator = integrator
        self.time = 0.0

    def add_body(self, body):  self.bodies.append(body)
    def add_force(self, force): self.forces.append(force)

    def step(self, dt):
        for b in self.bodies:
            b.clear_accumulators()
        for f in self.forces:
            f.apply(self)                 # each force adds to body accumulators
        self.integrator.step(self, dt)    # advance state
        self.handle_collisions()          # detect + resolve
        self.time += dt

    def handle_collisions(self):
        for i, b1 in enumerate(self.bodies):
            for b2 in self.bodies[i + 1:]:
                delta = b2.r - b1.r
                distance = np.linalg.norm(delta)
                min_distance = b1.radius + b2.radius
                if distance >= min_distance:
                    continue

                # The collision normal points from b1 to b2.
                normal = (delta / distance if distance > 0.0
                          else np.array([1.0, 0.0]))

                inv_m1 = 1.0 / b1.m
                inv_m2 = 1.0 / b2.m
                inv_mass_sum = inv_m1 + inv_m2

                # Correct overlap so the bodies do not remain interpenetrating.
                overlap = min_distance - distance
                b1.r -= normal * overlap * inv_m1 / inv_mass_sum
                b2.r += normal * overlap * inv_m2 / inv_mass_sum

                # Resolve an elastic collision only if the bodies are approaching.
                relative_velocity = b2.v - b1.v
                normal_speed = np.dot(relative_velocity, normal)
                if normal_speed < 0.0:
                    impulse = -2.0 * normal_speed / inv_mass_sum
                    b1.v -= impulse * inv_m1 * normal
                    b2.v += impulse * inv_m2 * normal