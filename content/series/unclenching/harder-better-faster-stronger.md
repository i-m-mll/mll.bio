---
title: "Harder: Better? Faster: Stronger?"
order: 2
created: 2023-07-30
updated: 2024-10-30
description: "How do we control the movements of our bodies when outside forces interfere?"
---

*This is the second part of a [series](/series/unclenching/unclenching).*

---

How do we control the movements of our bodies? 

One [paper](https://www.jneurosci.org/content/39/41/8135) from 2019 asks a little more specifically: how do we change the way we reach with our arms, when outside forces interfere? 

The authors set up a *reaching experiment*. Human volunteers sat at a desk with a display built into it, and reached across it while grabbing onto a *robot arm*. No, not like that prop in the lab in *Terminator 2*, but a rather more boring handle attached to a mechanical arm with sensors to measure the reaching path, and motors to *disturb* the reach with outside forces. The display showed visuals for the experiment, including position feedback: a cursor, which tracks the handle.

![](/images/unclenching/a997cb4f.jpeg)
*A) A victim seated at the apparatus used for the reaching experiment. B-C) From their perspective, with opaque and transparent screen states. The robot arm is visible to the right of C. The cursor is a small white circle. [Verfaille](https://doi.org/10.1371/journal.pone.0213732.g001)* [et al.](https://doi.org/10.1371/journal.pone.0213732.g001) *[(2019)](https://doi.org/10.1371/journal.pone.0213732.g001).*

Each volunteer makes many separate reaches in a session, one reach per *trial*. The researchers design sequences of many trials, so they can use statistics to answer questions. In this case: how did the reaches change after forces were added to disturb them?[^1]

Imagine someone makes 100 reaches in a row, starting and ending at the same points, and returning to the starting point between one trial and the next. They are told before the session that their reaches should be straight. They are pretty good at reaching straight. But the annoying robot disturbs every single reach. It applies a constant leftward force to the handle. Initially, this bends the paths of the reaches to the left.

This kind of disturbance is consistent and predictable. [Many](https://doi.org/10.1152/jn.1994.72.1.299) [past](https://doi.org/10.1016/S0896-6273(01)00301-4) [studies](https://doi.org/10.1152/jn.00943.2004) [show](https://doi.org/10.1523/JNEUROSCI.14-05-03208.1994) that healthy volunteers and non-human primates will *[adapt](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2752329/pdf/zns2883.pdf)* [and counteract](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2752329/pdf/zns2883.pdf) a force like this after many trials, so that the path of their reaches returns to the straight shape it had before the force was added. Not so annoying, after all. Manageable.

If the disturbing force is suddenly omitted from the next trial, the reach bends in the opposite direction—in this case, rightward—instead of instantly becoming straight again. So the volunteers are still compensating, still predicting the force will be there. But over just a few more trials, their reaches become straight again. 

![](/images/unclenching/50f6c44e.png)
*Sketch of typical changes seen when reaching in consistent force fields. On trial 1, the reach is approximately straight, but becomes bent (and does not quite reach the goal on time) when a leftward field is added on trial 2. The leftward field is applied until trial 50, and the volunteer learns to exactly counteract it and reach straight again. The field is removed on trial 51, leading to overcompensation, which disappears before trial 75.*

What if the disturbing force only appears on a fraction—say, 20%[^2]—of trials, chosen at random? That's not *exactly* predictable. Well... after a while the volunteer can tell they're in a place where some trials are disturbed. But they can't tell which ones until it happens. And then they hardly have time to switch their "opposing force" reaction on and off, since trials only last about a second. This is actually pretty annoying. And it would be unwise to use opposing-force on every trial, in this context. It'd help the 20%, but bend the other 80%. 

---

Is some other strategy better, here?

The authors found that people "double down" on their movements. Their reach speed gets a bit faster—higher inertia. They respond more vigorously to changes in sensory feedback, such as shifts in the perceived position of their arm. And the muscles used for reaching all contract a bit harder.[^3]

This go-harder strategy isn't a remedy for leftward disturbances in particular. Instead, go-harder reaches are slightly more *robust* to being altered by forces *in any direction*. Go-harder helps in case of 20% leftward disturbances, or 20% rightward, or a random mix of leftward, rightward, and something else (like a force field with [curl](https://en.wikipedia.org/wiki/Curl_(mathematics)))—in every case, go-harder won't totally straighten, but will reduce the impact. And unlike opposing-force, go-harder doesn't pointlessly bend the reach paths on trials where there is no disturbance.

![](/images/unclenching/7a0c53ee.png)
*Sketch of the paths of a typical straight reaching strategy (blue), and a go-harder straight reaching strategy (green). No opposing-force model is used here. Left: In the absence of a disturbance, both reaches are approximately straight; though—and this is not shown here—go-harder has a higher forward speed toward the goal. Center/Right: go-harder is more robust to either a leftward or rightward disturbance.*

The downside of go-harder? Nerves and muscles are a bit more active, so reaches cost a bit more energy. They're also a bit more difficult to stop once moving, having more inertia. And being more reactive to sensory changes, they sometimes flinch away from fluctuations that aren't coherent disturbances, but just errant bits of noise. 

---

The authors used the terms *model-based* and *model-free*, which are standard in optimal control and reinforcement learning. 

The strategy that applies opposing forces could be called model-based, because it relies on a specific model: we're predictably being pushed to the left, so we predictably push back equally to the right. We know precisely how to respond when we know precisely what we're responding to. 

The go-harder strategy could be called model-free, because we can't easily apply a precise model of a disturbance that randomly and suddenly appears on only 20% of trials. If we expect the disturbance will always be leftward, in principle we could turn up our anti-leftward opposing-force model at the right time. But this is hardly useful if we can't predict when the disturbance will appear—and don't have time to switch out one specific model for another. Maybe we don't expect all 20% to be leftward anyway. So we learn a non-specific strategy.

Go-harder isn't an exact model of forces, locally in time. But importantly, *it is still based on a model*: a model of context, of changing how we act when we observe some broader change in the world. And when we apply go-harder, we apply it with respect to another model—whatever action we want to make more robust.[^4] Straight reaches, is it?

---

Experiments about body movements tend to adopt clear boundaries and rules to separate one *behavioural context* from another. A volunteer reaches straight 50 times without disturbances (context A), then 100 times where disturbances show up 20% of the time (context B), and so on. In the wide world, context is often not so sequential or predetermined. 

The authors show that the strategies aren't all-or-nothing. Volunteers throttle up on both go-harder *and* opposing-force when a disturbance appears. It's unlikely the same disturbance would reappear immediately in the 20% context, so opposing-force will probably just pointlessly bend the next couple of reaches a little. But isn't it also wasteful to lean into go-harder, and spend energy adding resilience to the next reaches, which will probably be undisturbed? Why start using either of these strategies immediately, instead of waiting to collect more evidence that we're in the 20% context, or somewhere entirely different?

[Another recent study](https://doi.org/10.1523/ENEURO.0149-19.2019) shows that actually, we can learn to adapt—say, start applying an opposing force model—within a single trial. So “having no time to switch” isn’t quite right[^5]. But why do volunteers continue applying the model after the current trial ends?

Our impulsive strategy-mixing across trial boundaries hints at our actual uncertainty. We don't really know if the leftward disturbance we just felt means we're entering a place with 100% leftward disturbances, or if we won't see any other disturbances for a while, or if we'll suddenly be attacked by a tiger. On the other hand, researchers have a clear idea of a few contexts they're interested in, and how to subdivide their experiment into trials. But during the experiment, the volunteers almost *don't seem to believe it*.[^6] 

After a sudden disturbance, volunteers leaned into both opposing-force and go-harder. But they leaned back out of opposing-force pretty quickly, and go-harder a little more gradually. This kind of makes sense. Opposing-force models are disturbance-specific. Outside the lab, repetition of specific disturbances (events, scenarios) does happen sometimes. But it's more likely the future holds *some* disturbance— *any* disturbance. 

Uncertainty is more universal than almost anything particular, and go-harder is more general-purpose than opposing-force. There's more reason for us to keep it turned on, especially when we've recently been startled while making our way through the tall grass. Being startled is a good reminder—surprises are more common, out here in the open. And who knows where the tiger’s hiding?

*The kid tenses up when that other kid’s nearby, even when no pranks are currently being pulled*.

---

A force and a context are not simple, separate features of the world. They are entangled together, and our actions influence how they arise. 

I plunge my hand in a bucket of water and stir, then keeping my hand immersed, try to hold it still. The water keeps moving around it for some time. There might be eddies or turbulence which disturb my hand with forces I cannot predict. So: by applying some forces, I've created a context in which I’m subject to other, unpredictable forces. 

Researchers have had little choice but to make narrowing decisions about the structure of their experiments—the boundaries and categories they choose for defining what is a context, and what is a force. Otherwise, how would they set up specific measurements, to inform logical analyses? What could be the alternative? Something like: attempting to measure every atomic little thing about a person and the environment they move around in—not in some lab, but in their normal life. Then the researcher would be left with a boundless mess of data, and all their decisions and analyses still left to make. 

Maybe artificial intelligence is changing that, if it lets us wrangle large masses of data more gracefully, with fewer baked-in assumptions. 

But let's stop reaching, for now.

---

*Moment to moment we find patterns and inhabit them. As our attention narrows onto a "task at hand", we encounter disturbances that may be difficult or impossible to learn about quickly. So we lean harder into what we already have, trying to force a way through the world—with higher inertia, and flinchier reactions. This makes our chosen behaviour more robust to interference that we can’t exactly anticipate* — *especially the open-ended, flexible, adversarial interference we might expect from a predator or enemy.*

*As is the case for finger traps, it’s largely with hindsight and convention that “context” becomes separable, logical, or obvious—and we earn enough free time away from flinching, to start designing some flawed but beautiful experiments.*

---

*In the [next part](/series/unclenching/fake-it-til-you-make-it) of this series, we'll continue to explore robustness, in terms that make it a little easier to talk about the difference between learning a model of something in the world, and leaning into a model until the world is changed.*

---

[^1]: This post focuses on the logic of the results, without dwelling on the exact methods, setup, sequences… If you're curious, please check out the paper!

[^2]: In their first experiment it’s actually a curl field appearing with probability 1/6, or about 16.7% of trials.

[^3]: When opposing muscles (e.g. biceps and triceps) [contract at the same time](https://en.wikipedia.org/wiki/Muscle_coactivation), this stiffens the movement around joints (e.g. elbow). Stiffening due to such *co-contraction* [was already a hypothesis](https://doi.org/10.1371/journal.pcbi.1003869) for how the body minimizes the impact of disturbances. However, the authors note that co-contraction doesn’t only increase robustness directly through stiffening (the effect of which is not that large) but also through increased dynamic reactivity of active muscles to being stretched or shortened—an example of increased *control gains*.

[^4]: The authors simulate this behaviour with an [H-infinity controller](https://en.wikipedia.org/wiki/H-infinity_methods_in_control_theory), a type of *[robust controller](https://en.wikipedia.org/wiki/Robust_control)*. Whereas standard *optimal control* models like the [Linear-Quadratic-Gaussian](https://en.wikipedia.org/wiki/Linear%E2%80%93quadratic%E2%80%93Gaussian_control) controller can simulate reaches to a target even in the presence of force fields, H-infinity control modifies the cost function to expect a “worst-case” or adversarial disturbance, which results in more vigorous movements and increased control gains, which makes reaches more resilient.

[^5]: There are [differences between individuals](https://doi.org/10.1101/730713). Some appear more able to learn and use models (like opposing-force) on short notice, while others will apply go-harder instead of learning. When researchers apply even more time pressure, even the “good learners” tend to switch to go-harder.

[^6]: Our bodies have various reflexes or loops, different kinds of motor responses and learning that contribute to our aggregate behaviour. For example, there are fast and slow—[explicit and implicit](https://doi.org/10.1038/s41593-020-0600-3)—[processes of motor learning](https://osf.io/z9r8b/download). Neuroscientists have needed to be very careful how they construct their experiments, to tease apart these mechanisms.
