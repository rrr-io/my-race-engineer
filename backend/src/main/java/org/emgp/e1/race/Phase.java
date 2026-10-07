package org.emgp.e1.race;

public enum Phase {
    GRID("Grid"),
    SPRINT_RACE("Sprint Race"),
    GRAND_PRIX("Grand Prix"),
    FINAL_LAP("Final Lap"),
    FINISH_LINE("Finish Line");

    private final String label;

    Phase(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
