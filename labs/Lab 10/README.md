What is it?
It is a planetary simulator.

What physics does it use?
It uses drag, gravity, and collision physics.

How to control it.
While there are buttons that can be pressed there are also keyboard controls. 'Space' pauses and starts the simuation, 'R' resets the simulation, 'S' moves the simulation forward by one step and can be used when paused, 'I' increases the simulation speed while 'O' decreases it, 'E' can be used to change the integrator, and the '+' and '-' buttons zoom the graph in and out repectivly.

How I know it's right.
While the simulation is on the velocity verlet integrator the change in energy over the absolute value of the intial energy remains zero for 60 seconds unless something in the simulation is changed by the user.

Known limitations.
The simulation timer start before the simulation does, running for roughly 3 seconds before the simulation starts.
If a control slider, button, or box is used the box in which the simulation appears must be click in otherwise the keyboard controls will not function.