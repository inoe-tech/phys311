GitHub Pages URL:
    https://github.com/inoe-tech/phys311

MUST tier status table:

    Automatic Period Calculation - Done
    Log-Log plot - Done

Validation results:

 Test   -           Expectation            -            Measured 
Check 1 -   Less than 1% change in 2 min   - 1 Planet: 0% ; 6 Planets: 44.79%
Check 2 - Little to no change in |Δp|/|p₀| - No noted change during collision

Check 1: Fail
Check 2: Pass

Decisions:

    Inside of DECISIONS.md

Two bugs you fixed — symptom, cause, fix:

    Bug 1: Planets were apearing above the line for the Log-Log plot; Part of the equation used to calculate the planet's loacation on the plot was wrong; I edited the equation

    Bug 2: The HUD's debug mode text was on by default without its infromation. After pressing "D" to go into debug mode the information would appear and the text would disappear; An exclimation mark was missing in the code that controls weather the debug text should be visable or not; I added an exclimation point.

Next week's plan:

    I plan to make my toggleables and my log-log graph drop downs so they don't take up as much space. Then I'll add a turn off realism mode that replaces all the sliders with boxes that can have any value. Finally I'll fix the bug that is making my |ΔE/E₀| change so much.