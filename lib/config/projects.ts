import type { Project } from "@/components/project-card"

export const projects: Project[] = [
  {
    title: "Feedbax",
    description:
      "A JAX library for training neural networks to control simulated biomechanical systems. Designed for motor neuroscience research, featuring flexible intervention and perturbation capabilities for studying feedback control.",
    url: "https://github.com/i-m-mll/feedbax",
    tags: ["JAX", "Neuroscience", "Machine Learning"],
    icon: "brain",
  },
  {
    title: "epis.team",
    description:
      "A multiplayer web app for calibration training and forecasting practice. Players estimate numerical answers together and see how their predictions compare to truth and each other.",
    url: "https://epis.team",
    tags: ["Web App", "Forecasting", "Multiplayer"],
    icon: "target",
  },
]
