A1 — Title & pitch (5 pts)

    Planetary Puzzle. They see a planetary system and it is up to them to change it and make it stable.

A2 — The physics (12 pts)

    The forces used by the system are newtonian gravity, drag, collistion restitution, and directional force add by an user. The only constraints in the system are the bodies themselves as there is no world border and all the bodies can move. 
    The new thing that is going to be added to the system is an automatic period measurement with a log-log plot.
    Velocity Verlet will be used as the integrator because it works very well with orbits and oscilations.
    Currently the simulation uses seconds and meters as its units but that will be changed into AU and years to be more accurate to a planetary orbit.

A3 — Three-tier scope (12 pts)

    Must: An automatic period measurement with a log-log plot.

    Should: Change units into AU and years instead of meters and seconds. Maybe also move all the toggleables to a drop down menu so they don't all crowd the user's view.

    Could: Add a toggle button that makes it to where planets are constantly spawned in when right mouse is clicked (This was a sugestion that was given to me). Also make it to where if a planet touches the star it would make the planet disappear and add its mass to the star and make it toggleable. Make it to where time could be set to seconds, minutes, days, weeks months, and years with a clock to make the simulation slow down make more sense. Make planets spawn with a random or custion mass. Maybe add a toggleable "turn off realism" mode that replaces all the sliders with boxes that can have any value.

A4 — Validation plan (14 pts)

    Check 1: With all force reducers off like drag, a dt of 1/240, using velocity verlet as the integrator and with all collitions being 100% elastic the simulation's |ΔE/E₀| shouldn't have more than a 1% change for a total of 2 minutes.

    Check 2: With the collition restitution set to a value of 0.6 the simulation's |Δp|/|p₀| should have little to no change when two bodies collide. The only the kinetic energy value should greatly change.

A5 — Biggest risk + fallback (6 pts)

    The thing most likely to sink this project is implementing the automatic period measurment of each planet. If I have to, my fallback plan is to forget about the period measurement being automatic and instead adding a button that calculates it for a selceted planet.

A6 — Week-by-week timeline (4 pts)

    Timeline:
    Week	Deliverable
    11	    The Proposal and the risk spike
    12	    The musts is completed and deployed
    13	    The shoulds and validations are completed. The simulation also polished and contains a write-up.

A7 — Audience (2 pts)

    This simulation is primarly for gamers and after two mintutes they should have a basic understanding of how planetary systems behave.
    The simulation should be a learning by playing experience.