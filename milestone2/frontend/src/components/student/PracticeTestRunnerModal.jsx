import React, { useState } from 'react';
import InteractiveExamRunner from './InteractiveExamRunner';

/**
 * Interactive AI Practice Test Runner
 * Generates multimodal test papers with:
 * - MCQ (Single-select multiple choice)
 * - Multi-Select (Multiple choice with multiple correct answers)
 * - Written / Descriptive / Multimodal questions with live camera capture & file upload
 *
 * Guaranteed exact-same questions on Retake / Retest sessions.
 */
export default function PracticeTestRunnerModal({
  practiceConfig,
  onClose,
  onSubmitResult,
}) {
  const { subject, topic, difficulty, questionCounts = {}, isTimed, durationMinutes = 15 } = practiceConfig;

  // Generate question pool based on topic, or reuse existing questions on Retake
  const [questions] = useState(() => {
    // 1. Retest / Retake: reuse exact same questions if passed in config
    if (practiceConfig.questions && Array.isArray(practiceConfig.questions) && practiceConfig.questions.length > 0) {
      return practiceConfig.questions;
    }

    const list = [];
    let qId = 1;
    const cleanTopic = (topic || 'General Studies').trim();
    const cleanSubject = (subject || 'Science & Technology').trim();

    // Exact counts requested by student in configuration
    const reqMcq = questionCounts.mcq !== undefined ? Number(questionCounts.mcq) : 5;
    const reqMulti = questionCounts.multiSelect !== undefined ? Number(questionCounts.multiSelect) : 2;
    const reqShort = questionCounts.shortAnswer !== undefined ? Number(questionCounts.shortAnswer) : 1;
    const reqLong = questionCounts.longAnswer !== undefined ? Number(questionCounts.longAnswer) : 0;

    const totalRequested = reqMcq + reqMulti + reqShort + reqLong;
    const finalMcq = totalRequested === 0 ? 5 : reqMcq;
    const finalMulti = totalRequested === 0 ? 2 : reqMulti;
    const finalShort = totalRequested === 0 ? 1 : reqShort;
    const finalLong = totalRequested === 0 ? 0 : reqLong;

    // Detect subject domains accurately
    const lowerTopic = `${cleanTopic} ${cleanSubject}`.toLowerCase();
    const isQuad = lowerTopic.includes('quad') || lowerTopic.includes('equation') || lowerTopic.includes('algebra') || lowerTopic.includes('math') || lowerTopic.includes('calculus') || lowerTopic.includes('trig');
    const isNewton = lowerTopic.includes('newton') || lowerTopic.includes('motion') || lowerTopic.includes('force') || lowerTopic.includes('mechanic') || lowerTopic.includes('kinematic') || lowerTopic.includes('gravit');
    const isBST = lowerTopic.includes('tree') || lowerTopic.includes('bst') || lowerTopic.includes('graph') || lowerTopic.includes('dsa') || lowerTopic.includes('data structure') || lowerTopic.includes('algorithm');
    const isThermo = lowerTopic.includes('thermo') || lowerTopic.includes('heat') || lowerTopic.includes('entropy') || (lowerTopic.includes('physic') && !isNewton);
    const isAIML = lowerTopic.includes('ai') || lowerTopic.includes('machine learning') || lowerTopic.includes('deep learning') || lowerTopic.includes('neural') || lowerTopic.includes('vision');

    // 1. Single-Select MCQ Banks
    const quadMcqBank = [
      {
        question: 'What is the discriminant D of the quadratic equation ax² + bx + c = 0, and which condition ensures two distinct real roots?',
        options: ['D = b² - 4ac > 0', 'D = b² - 2ac = 0', 'D = b² + 4ac < 0', 'D = 2b - 4ac > 0'],
        correctOption: 0,
        explanation: 'The discriminant is D = b² - 4ac. When D > 0, the square root yields two distinct real values producing two distinct real roots.',
      },
      {
        question: 'If α and β are the roots of the quadratic equation 2x² - 8x + 6 = 0, what is the sum of the roots (α + β) using Vieta’s formulas?',
        options: ['4  (since -b/a = -(-8)/2 = 4)', '-4', '3', '8'],
        correctOption: 0,
        explanation: 'By Vieta’s formulas, the sum of roots for ax² + bx + c = 0 is -b/a = -(-8)/2 = 4.',
      },
      {
        question: 'What are the roots of the quadratic equation x² - 7x + 12 = 0?',
        options: ['x = 3 and x = 4', 'x = -3 and x = -4', 'x = 2 and x = 6', 'x = 1 and x = 12'],
        correctOption: 0,
        explanation: 'Factoring (x - 3)(x - 4) = 0 yields x = 3 and x = 4.',
      },
      {
        question: 'What is the x-coordinate of the vertex (axis of symmetry) for the parabola y = ax² + bx + c?',
        options: ['x = -b / (2a)', 'x = -b / a', 'x = -c / (2a)', 'x = b / (4a)'],
        correctOption: 0,
        explanation: 'Setting dy/dx = 2ax + b = 0 yields the stationary vertex coordinate x = -b / (2a).',
      },
      {
        question: 'For what value of k does the quadratic equation kx² - 6x + 9 = 0 have exactly one real repeated root?',
        options: ['k = 1', 'k = 0', 'k = 2', 'k = 4'],
        correctOption: 0,
        explanation: 'For equal roots, D = b² - 4ac = (-6)² - 4(k)(9) = 36 - 36k = 0 => k = 1.',
      },
      {
        question: 'If a quadratic equation with rational coefficients has one root equal to 3 + √7, what must the other root be?',
        options: ['3 - √7 (the irrational conjugate)', '-3 + √7', '3 + 2√7', '1 / (3 + √7)'],
        correctOption: 0,
        explanation: 'Irrational roots of quadratic equations with rational coefficients always occur in conjugate pairs (p + √q and p - √q).',
      },
      {
        question: 'Which algebraic method is used to derive the quadratic formula from ax² + bx + c = 0?',
        options: ['Completing the square', 'Euler substitution', 'L’Hôpital’s rule', 'Integration by parts'],
        correctOption: 0,
        explanation: 'Dividing by a and adding (b/2a)² to both sides completes the square into [x + b/(2a)]² = (b² - 4ac)/(4a²).',
      },
      {
        question: 'What is the product of roots (α·β) of the quadratic equation 3x² + 5x - 12 = 0?',
        options: ['-4  (since c/a = -12/3 = -4)', '-5/3', '4', '12'],
        correctOption: 0,
        explanation: 'By Vieta’s formulas, the product of roots α·β = c/a = -12/3 = -4.',
      },
    ];

    const newtonMcqBank = [
      {
        question: 'According to Newton’s First Law of Motion, an object maintains constant velocity or stays at rest unless acted upon by:',
        options: ['An unbalanced net external force', 'An internal thermodynamic gradient', 'A gravitational potential only', 'A continuous constant force equal to its mass'],
        correctOption: 0,
        explanation: 'Newton’s First Law (Law of Inertia) dictates that a net non-zero external force is necessary to change an object’s velocity.',
      },
      {
        question: 'Newton’s Second Law is fundamentally defined as the net force being equal to the rate of change of:',
        options: ['Linear momentum (F = dp/dt)', 'Kinetic energy with respect to displacement', 'Angular velocity with respect to radius', 'Total work done per unit time'],
        correctOption: 0,
        explanation: 'Newton’s Second Law states F_net = dp/dt. When mass m is constant, dp/dt = d(mv)/dt = m(dv/dt) = ma.',
      },
      {
        question: 'Which statement is strictly true regarding Newton’s Third Law action-reaction force pairs?',
        options: ['They act simultaneously on two different interacting bodies and never cancel each other', 'They act on the same body in opposite directions to establish equilibrium', 'The action force precedes the reaction force by a slight time delay', 'The reaction force is smaller if the opposing object has greater mass'],
        correctOption: 0,
        explanation: 'Action and reaction forces act on different bodies simultaneously; therefore they never cancel each other on a single body’s free body diagram.',
      },
      {
        question: 'A net horizontal force of 20 N is applied to a 4 kg mass resting on a frictionless surface. What is its acceleration?',
        options: ['5.0 m/s² (a = F/m = 20/4)', '80 m/s²', '0.2 m/s²', '9.8 m/s²'],
        correctOption: 0,
        explanation: 'Using a = F / m = 20 N / 4 kg = 5.0 m/s².',
      },
      {
        question: 'What is the apparent weight recorded by a scale for a person of mass m in an elevator accelerating upward with acceleration a?',
        options: ['N = m(g + a)', 'N = m(g - a)', 'N = mg', 'N = ma'],
        correctOption: 0,
        explanation: 'Setting up the vertical equation of motion: N - mg = ma => N = m(g + a).',
      },
      {
        question: 'Why does the centripetal force directed toward the center of a circular path perform zero work on a body in uniform circular motion?',
        options: ['The centripetal force is perpendicular to the instantaneous velocity displacement (cos 90° = 0)', 'Centripetal acceleration is identically zero', 'Displacement over any interval is zero', 'Work can only be performed by non-conservative forces'],
        correctOption: 0,
        explanation: 'Work W = F · d · cos(θ). Since the centripetal force is perpendicular to the tangent velocity (θ = 90°), W = 0.',
      },
      {
        question: 'When a falling object reaches terminal velocity, what is the relation between downward gravity and upward aerodynamic drag?',
        options: ['Aerodynamic drag equals gravitational force (net force = 0, acceleration = 0)', 'Drag exceeds gravity causing upward deceleration', 'Drag drops to zero due to laminar air flow', 'Gravity doubles due to atmospheric pressure'],
        correctOption: 0,
        explanation: 'At terminal velocity, drag F_d balances weight mg so net force is zero and velocity remains constant.',
      },
      {
        question: 'What is the SI unit of momentum (p = mv) in terms of base dimensions?',
        options: ['kg·m/s (or N·s)', 'kg·m²/s²', 'N/m²', 'kg/s²'],
        correctOption: 0,
        explanation: 'Momentum p = mass (kg) × velocity (m/s) = kg·m/s, which is also equivalent to Newton-seconds (N·s).',
      },
    ];

    const aimlMcqBank = [
      {
        question: 'Which optimization algorithm adapts individual learning rates for each parameter using first and second moments of gradients?',
        options: ['Adam (Adaptive Moment Estimation)', 'Standard SGD with fixed learning rate', 'Mini-batch gradient descent without momentum', 'Coordinate Descent on convex loss'],
        correctOption: 0,
        explanation: 'Adam computes exponentially decaying averages of past squared gradients (v_t) and past gradients (m_t).',
      },
      {
        question: 'Why is the ReLU (Rectified Linear Unit) activation function favored over Sigmoid in deep hidden layers?',
        options: ['It avoids gradient saturation for positive activations, mitigating vanishing gradients', 'It maps all negative numbers strictly to +1 for faster multiplication', 'It ensures all output activations sum to exactly 1.0', 'It is twice continuously differentiable everywhere including zero'],
        correctOption: 0,
        explanation: 'ReLU has constant derivative 1 for positive inputs, avoiding the derivative shrinkage (< 0.25) of Sigmoid.',
      },
      {
        question: 'In multimodal AI proctoring, how is head pose yaw/pitch/roll typically estimated from video frames?',
        options: ['Perspective-n-Point (PnP) solver mapping 2D facial landmarks to a canonical 3D head model', 'Simple pixel luminance thresholding over the forehead region', 'Acoustic Doppler shift detection from microphone sensors', 'Counting total keystrokes per second on the keyboard'],
        correctOption: 0,
        explanation: 'EPnP / solvePnP algorithms solve the camera pose from 2D FaceMesh landmarks to 3D facial coordinates.',
      },
      {
        question: 'Which regularization technique randomly drops hidden units during training to prevent feature co-adaptation?',
        options: ['Dropout', 'L1 Lasso Regularization', 'Batch Normalization', 'Early Stopping'],
        correctOption: 0,
        explanation: 'Dropout randomly zeroes out activation outputs during training to enforce redundant, distributed representations.',
      },
      {
        question: 'In binary classification, what metric represents the fraction of actual positive cases that were correctly identified?',
        options: ['Recall / Sensitivity (TP / [TP + FN])', 'Precision (TP / [TP + FP])', 'Specificity (TN / [TN + FP])', 'Accuracy ([TP + TN] / Total)'],
        correctOption: 0,
        explanation: 'Recall measures the true positive rate (coverage of all actual positive labels).',
      },
      {
        question: 'What core architectural mechanism allows Transformer models to attend to relationships across arbitrary token distances simultaneously?',
        options: ['Multi-Head Self-Attention', 'Recurrent cell hidden gating', 'Convolutional pooling filters', 'Skip-gram word embeddings'],
        correctOption: 0,
        explanation: 'Scaled Dot-Product Self-Attention computes pairwise similarity across all token pairs in parallel.',
      },
    ];

    const bstMcqBank = [
      {
        question: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST) with N nodes?',
        options: ['O(N) - degenerate linear linked list structure', 'O(log N) - balanced height branching', 'O(1) - hash table direct lookup', 'O(N log N) - divide and conquer sort'],
        correctOption: 0,
        explanation: 'In an unbalanced BST, keys inserted in sorted order degenerate the tree into a linear linked list where height is O(N).',
      },
      {
        question: 'Which tree traversal on a valid Binary Search Tree produces node values in strictly sorted ascending order?',
        options: ['Inorder traversal (Left, Root, Right)', 'Preorder traversal (Root, Left, Right)', 'Postorder traversal (Left, Right, Root)', 'Level-order breadth-first traversal'],
        correctOption: 0,
        explanation: 'Inorder (Left -> Root -> Right) visits keys strictly in ascending order due to the BST invariant.',
      },
      {
        question: 'When deleting a node with two children from a BST, what is the standard replacement node to preserve the BST property?',
        options: ['Its inorder successor (smallest in right subtree) or inorder predecessor', 'Any arbitrary leaf node from the left subtree', 'The root node of the entire tree', 'A newly generated dummy sentinel node'],
        correctOption: 0,
        explanation: 'Replacing with the inorder successor or predecessor guarantees that all left and right inequalities remain strictly preserved.',
      },
      {
        question: 'What is the maximum number of nodes in a binary tree of strictly balanced height h (where root is height 1)?',
        options: ['2^h - 1', '2^(h - 1)', 'h^2', '2h + 1'],
        correctOption: 0,
        explanation: 'A full binary tree of height h has 1 + 2 + 4 + ... + 2^(h-1) = 2^h - 1 nodes.',
      },
      {
        question: 'In an AVL tree, what balance factor indicates that a Left-Right (LR) double rotation is required?',
        options: ['Node balance factor +2 with left child balance factor -1', 'Node balance factor -2 with right child balance factor +1', 'Node balance factor 0', 'Node balance factor +1 with left child balance factor +1'],
        correctOption: 0,
        explanation: 'An LR imbalance occurs when the root has balance +2 and left child has balance -1.',
      },
      {
        question: 'What is the space complexity of an iterative tree traversal using an explicit stack for a balanced BST with N nodes?',
        options: ['O(log N) stack frames corresponding to tree height', 'O(N) auxiliary memory in all cases', 'O(1) auxiliary memory', 'O(N^2) stack frames'],
        correctOption: 0,
        explanation: 'In a balanced BST, the maximum stack depth equals tree height, which is bounded by O(log N).',
      },
      {
        question: 'Which property distinguishes a Red-Black Tree from an AVL tree in terms of operational trade-offs?',
        options: ['Red-Black trees require fewer rotations during insertions/deletions, making them faster for write-heavy workloads', 'Red-Black trees are strictly more balanced than AVL trees', 'Red-Black trees do not support O(log N) search', 'AVL trees allow arbitrary node heights without rotation'],
        correctOption: 0,
        explanation: 'Red-Black trees have slightly relaxed balance criteria (height ≤ 2 log(N+1)), requiring at most 2 rotations on insert and 3 on delete.',
      },
      {
        question: 'What is the time complexity of building a balanced BST from a pre-sorted array of N elements?',
        options: ['O(N) using divide-and-conquer midpoint recursion', 'O(N log N) through successive insertions', 'O(N²)', 'O(log N)'],
        correctOption: 0,
        explanation: 'By picking the middle element as root and recursively building left and right subtrees, each element is visited once in O(N) total time.',
      },
    ];

    const thermoMcqBank = [
      {
        question: 'What thermodynamic quantity is described as the microscopic measure of molecular disorder and irreversible dissipation in a closed system?',
        options: ['Entropy (S)', 'Enthalpy (H)', 'Internal Energy (U)', 'Gibbs Free Energy (G)'],
        correctOption: 0,
        explanation: 'Entropy (S) quantifies the microscopic multiplicity and irreversibility of energy distribution.',
      },
      {
        question: 'Which thermodynamic process occurs strictly under constant pressure in a cylinder-piston system?',
        options: ['Isobaric process (dP = 0)', 'Isochoric process (dV = 0)', 'Isothermal process (dT = 0)', 'Adiabatic process (dQ = 0)'],
        correctOption: 0,
        explanation: 'Isobaric signifies constant pressure throughout the state change.',
      },
      {
        question: 'In an ideal adiabatic expansion process, which relation correctly describes the relationship between heat transfer Q and work done W?',
        options: ['Q = 0 and dU = -dW', 'Q = W with dU = 0', 'W = 0 with dU = dQ', 'Q = dH + VdP'],
        correctOption: 0,
        explanation: 'By definition of adiabatic process, no heat enters or leaves (Q = 0); hence dU = -dW.',
      },
      {
        question: 'What is the theoretical maximum thermal efficiency of a Carnot heat engine operating between reservoirs at 600 K and 300 K?',
        options: ['50% (η = 1 - 300/600 = 0.50)', '100% ideal efficiency', '33.3%', '75%'],
        correctOption: 0,
        explanation: 'Carnot efficiency is η = 1 - (Tc / Th) = 1 - (300 / 600) = 0.50 (50%).',
      },
      {
        question: 'The Third Law of Thermodynamics states that the entropy of a pure crystalline substance at absolute zero (0 Kelvin) is:',
        options: ['Strictly zero', 'Infinite due to quantum zero-point fluctuation', 'Equal to ambient atmospheric pressure', 'Negative infinity'],
        correctOption: 0,
        explanation: 'At absolute zero temperature, a perfect crystal exists in a single microstate with entropy S = k ln(1) = 0.',
      },
      {
        question: 'Which thermodynamic state function G = H - TS determines the spontaneity of a chemical reaction at constant temperature and pressure?',
        options: ['Gibbs Free Energy (ΔG < 0 for spontaneous processes)', 'Helmholtz Free Energy', 'Specific Heat Ratio', 'Joule-Thomson coefficient'],
        correctOption: 0,
        explanation: 'A negative change in Gibbs free energy (ΔG < 0) indicates a thermodynamically favored spontaneous process.',
      },
    ];

    // Multi-perspective diverse templates for any custom or uncatalogued topic (NO REPEATS)
    const genericTemplates = [
      {
        q: (t, s) => `What foundational principle or governing law forms the core baseline of ${t}?`,
        opts: (t, s) => [
          `Conservation of state invariants and formal boundary conditions in ${t}`,
          `Unconstrained empirical divergence without reproducible constraints`,
          `Complete neglect of dimensional boundary conditions`,
          `Asymptotic random distribution model`,
        ],
        ans: 0,
        exp: (t, s) => `Under standard core tenets of ${t}, conservation principles and invariant boundary constraints dictate deterministic system stability.`,
      },
      {
        q: (t, s) => `When evaluating the performance and operational efficiency of ${t}, which primary metric or diagnostic indicator is considered critical?`,
        opts: (t, s) => [
          `Throughput, latency, and resource scaling efficiency under peak load`,
          `Uncalibrated raw execution count without variance tracking`,
          `Arbitrary constant offset neglecting input dimensions`,
          `Non-deterministic stochastic oscillation factor`,
        ],
        ans: 0,
        exp: (t, s) => `Rigorous evaluation of ${t} relies on quantifiable performance metrics including throughput, latency bounds, and resource utilization.`,
      },
      {
        q: (t, s) => `In practical implementations of ${t}, what constitutes the most common bottleneck or operational failure mode?`,
        opts: (t, s) => [
          `Resource saturation, boundary condition violations, and unhandled edge states`,
          `Over-adherence to mathematical rigor causing computational stall`,
          `Total absence of input parameters`,
          `Linear clock frequency drift across standard CPU cycles`,
        ],
        ans: 0,
        exp: (t, s) => `Edge-case boundary violations and resource saturation represent the primary failure points in real-world ${t} deployments.`,
      },
      {
        q: (t, s) => `Which design pattern or methodological approach is best suited to optimize modularity and extensibility in ${t}?`,
        opts: (t, s) => [
          `Decoupled abstraction layers with well-defined interface contracts`,
          `Monolithic tightly-coupled global state manipulation`,
          `Hardcoding static constants across all functional modules`,
          `Bypassing error-handling routines to minimize instruction counts`,
        ],
        ans: 0,
        exp: (t, s) => `Decoupled architectures with explicit interface contracts ensure that ${t} systems remain scalable and testable.`,
      },
      {
        q: (t, s) => `Under high-stress or extreme boundary conditions, how does a robust ${t} system ensure data integrity and resilience?`,
        opts: (t, s) => [
          `Graceful degradation, automated fallback policies, and transactional rollback mechanisms`,
          `Immediate unconditional process termination with zero telemetry`,
          `Silent truncation of out-of-bound variables`,
          `Unrestricted infinite retry loops without exponential backoff`,
        ],
        ans: 0,
        exp: (t, s) => `Fault-tolerant implementations employ fallback isolation, checkpointing, and graceful degradation to maintain systemic integrity.`,
      },
      {
        q: (t, s) => `What is the principal trade-off between theoretical models of ${t} and real-world physical or software implementations?`,
        opts: (t, s) => [
          `Theoretical models assume idealized noise-free conditions, whereas real deployments contend with latency, friction, and environmental variance`,
          `Real implementations have zero latency whereas theoretical models require infinite time`,
          `Theoretical models cannot be formulated with mathematical equations`,
          `There is no measurable difference between theory and empirical practice in ${t}`,
        ],
        ans: 0,
        exp: (t, s) => `Empirical systems must account for environmental noise, imperfect sensors, and physical latency that ideal models omit.`,
      },
      {
        q: (t, s) => `Which standard verification or validation protocol is recommended before deploying changes to a ${t} architecture?`,
        opts: (t, s) => [
          `Comprehensive automated test suites, regression benchmarks, and formal property verification`,
          `Manual ad-hoc testing on production workloads without backups`,
          `Skipping unit tests whenever runtime syntax passes compilation`,
          `Relying exclusively on post-incident user bug reports`,
        ],
        ans: 0,
        exp: (t, s) => `Automated test suites and property-based verification provide quantifiable confidence prior to production release.`,
      },
      {
        q: (t, s) => `How has modern tooling and computational automation transformed traditional workflows in ${t}?`,
        opts: (t, s) => [
          `Enabled automated continuous synthesis, real-time telemetry, and algorithmic optimization`,
          `Eliminated the need for human domain expertise and architectural review`,
          `Replaced deterministic algorithms with completely arbitrary guesses`,
          `Forced all computations to be executed on single-threaded legacy hardware`,
        ],
        ans: 0,
        exp: (t, s) => `Modern automation and telemetry facilitate rapid iterative optimization and proactive anomaly detection in ${t}.`,
      },
    ];

    // Select active MCQ bank
    const activeMcqBank = isQuad
      ? quadMcqBank
      : isNewton
      ? newtonMcqBank
      : isAIML
      ? aimlMcqBank
      : isBST
      ? bstMcqBank
      : isThermo
      ? thermoMcqBank
      : null;

    for (let i = 0; i < finalMcq; i++) {
      let qData;
      if (activeMcqBank && activeMcqBank.length > 0) {
        const item = activeMcqBank[i % activeMcqBank.length];
        const isRepeatedCycle = i >= activeMcqBank.length;
        qData = {
          question: isRepeatedCycle ? `${item.question} (Variation #${Math.floor(i / activeMcqBank.length) + 1})` : item.question,
          options: item.options,
          correctOption: item.correctOption,
          explanation: item.explanation,
        };
      } else {
        const tmpl = genericTemplates[i % genericTemplates.length];
        const isRepeatedCycle = i >= genericTemplates.length;
        qData = {
          question: isRepeatedCycle
            ? `${tmpl.q(cleanTopic, cleanSubject)} (Variation #${Math.floor(i / genericTemplates.length) + 1})`
            : tmpl.q(cleanTopic, cleanSubject),
          options: typeof tmpl.opts === 'function' ? tmpl.opts(cleanTopic, cleanSubject) : tmpl.opts,
          correctOption: tmpl.ans,
          explanation: typeof tmpl.exp === 'function' ? tmpl.exp(cleanTopic, cleanSubject) : tmpl.exp,
        };
      }

      list.push({
        id: `mcq_${qId}`,
        num: qId++,
        type: 'mcq',
        marks: 1,
        question: qData.question,
        options: qData.options,
        correctOption: qData.correctOption,
        explanation: qData.explanation,
      });
    }

    // 2. Generate Multi-Select Questions
    const quadMultiBank = [
      {
        question: 'Select all valid properties and algebraic conditions that apply to the quadratic equation ax² + bx + c = 0 (where a ≠ 0):',
        options: [
          'If the discriminant b² - 4ac > 0, the equation has two distinct real roots',
          'The sum of the roots is given by -b/a and the product of roots is c/a (Vieta’s formulas)',
          'If the discriminant b² - 4ac < 0, the roots are complex conjugate pairs',
          'The vertex of the parabola is always located at (0, 0) regardless of coefficients',
        ],
        correctOptions: [0, 1, 2],
        explanation: 'Options A, B, and C are fundamental quadratic theorems. The vertex depends on coefficients: x = -b/(2a).',
      },
      {
        question: 'Select all quadratic functions whose parabolic graph opens upwards (convex) and intersects the x-axis at two distinct real points:',
        options: [
          'f(x) = x² - 5x + 6  (a > 0 and D = 25 - 24 = 1 > 0)',
          'f(x) = 2x² - 8  (a > 0 and D = 0 - 4(2)(-8) = 64 > 0)',
          'f(x) = -x² + 4x - 5  (a < 0, opens downward)',
          'f(x) = x² + 2x + 5  (D = 4 - 20 = -16 < 0, no real x-intercepts)',
        ],
        correctOptions: [0, 1],
        explanation: 'A and B have positive leading coefficients (a > 0, opening up) and positive discriminants (two real roots).',
      },
    ];

    const newtonMultiBank = [
      {
        question: 'Select all valid physical properties and statements concerning Newton’s Third Law action-reaction force pairs:',
        options: [
          'Action and reaction forces act simultaneously on two completely different interacting bodies',
          'Action and reaction forces have strictly equal magnitudes and opposite directions',
          'Action and reaction forces never cancel each other out on the same body’s free-body diagram',
          'The reaction force only appears after the action force has finished propagating through the medium',
        ],
        correctOptions: [0, 1, 2],
        explanation: 'Action-reaction pairs act on different objects at the exact same instant, so they cannot cancel each other.',
      },
      {
        question: 'Select all physical quantities that remain strictly conserved in an isolated system during an ideal elastic collision:',
        options: [
          'Total linear momentum of the system',
          'Total kinetic energy of the system',
          'Total mechanical energy of the system',
          'Individual velocity vector of each colliding object',
        ],
        correctOptions: [0, 1, 2],
        explanation: 'In elastic collisions without external forces, both total momentum and total kinetic energy are conserved.',
      },
    ];

    const aimlMultiBank = [
      {
        question: 'Select all regularization techniques commonly utilized to prevent overfitting in deep neural networks:',
        options: [
          'Dropout layers applied during forward training passes',
          'L2 Weight Decay (Ridge penalty on network weight tensors)',
          'Data Augmentation (random crops, rotations, color shifts)',
          'Increasing model parameters and hidden depth without additional training data',
        ],
        correctOptions: [0, 1, 2],
        explanation: 'Dropout, L2 decay, and Data Augmentation constrain model complexity. Adding parameters increases overfitting.',
      },
      {
        question: 'Select all valid statements regarding Gradient Descent optimization algorithms:',
        options: [
          'Stochastic Gradient Descent (SGD) calculates loss gradients using individual sample batches per update step',
          'Adam adapts per-parameter learning rates using exponential moving averages of gradients and squared gradients',
          'Setting the learning rate excessively high can cause loss divergence or numerical overflow',
          'Standard gradient descent is mathematically guaranteed to find the global minimum for arbitrary non-convex neural losses',
        ],
        correctOptions: [0, 1, 2],
        explanation: 'A, B, and C are true. Non-convex loss landscapes contain local minima and saddle points, so global convergence is not guaranteed.',
      },
    ];

    const bstMultiBank = [
      {
        question: 'Select all valid self-balancing tree invariants and balance factor properties that apply to AVL Trees:',
        options: [
          'The height difference between left and right subtrees of any node cannot exceed 1',
          'Every node has a balance factor in {-1, 0, +1}',
          'Insertions always require an exponential number of rotations in worst-case',
          'Worst-case search, insert, and delete run in guaranteed O(log N) time',
        ],
        correctOptions: [0, 1, 3],
        explanation: 'Options A, B, and D are valid AVL invariants. Rotations are bounded by O(1) for insertion and O(log N) for deletion, never exponential.',
      },
      {
        question: 'Select all tree structures that guarantee worst-case O(log N) search operations:',
        options: ['Red-Black Tree', 'AVL Tree', 'Unbalanced Binary Search Tree with sorted input', 'B-Tree of order m'],
        correctOptions: [0, 1, 3],
        explanation: 'Red-Black, AVL, and B-Trees enforce balance invariants maintaining O(log N) height.',
      },
    ];

    const thermoMultiBank = [
      {
        question: 'Select all thermodynamic properties that are state functions (independent of the path taken between equilibrium states):',
        options: ['Internal Energy (U)', 'Heat transferred (Q)', 'Entropy (S)', 'Work done by the system (W)'],
        correctOptions: [0, 2],
        explanation: 'Internal Energy and Entropy are state functions depending only on initial and final states. Heat (Q) and Work (W) are path-dependent quantities.',
      },
      {
        question: 'Select all valid statements regarding the Second Law of Thermodynamics and reversible cycles:',
        options: [
          'No heat engine can have an efficiency higher than a Carnot engine operating between the same two temperatures',
          'Heat spontaneously flows from higher temperature bodies to lower temperature bodies',
          'In any real spontaneous process, the total entropy of the universe decreases',
          'Entropy is conserved strictly in ideal reversible thermodynamic cycles',
        ],
        correctOptions: [0, 1, 3],
        explanation: 'A, B, and D are true. In spontaneous real processes, the entropy of the universe strictly increases (ΔS_univ > 0).',
      },
    ];

    const activeMultiBank = isQuad
      ? quadMultiBank
      : isNewton
      ? newtonMultiBank
      : isAIML
      ? aimlMultiBank
      : isBST
      ? bstMultiBank
      : isThermo
      ? thermoMultiBank
      : null;

    const genericMultiTemplates = [
      {
        q: (t) => `Select all valid conditions, boundary invariants, and architectural axioms that govern ${t}:`,
        opts: (t) => [
          `Deterministically preserves state stability within defined operating tolerances`,
          `Enforces rigorous verification of input invariants before executing state transitions`,
          `Violates empirical physical conservation laws under standard operating loads`,
          `Enables modular composition and predictable analytical outcomes`,
        ],
        ans: [0, 1, 3],
        exp: (t) => `Valid tenets of ${t} emphasize determinism, invariant verification, and modular composability.`,
      },
      {
        q: (t) => `Select all diagnostic criteria and performance metrics used to benchmark ${t} under load:`,
        opts: (t) => [
          `Quantifiable throughput under peak concurrent stress`,
          `Predictable bounded latency distribution across standard deviations`,
          `Unbounded memory leakage over sustained execution intervals`,
          `Error recovery rate following transient edge-condition faults`,
        ],
        ans: [0, 1, 3],
        exp: (t) => `Benchmarking ${t} involves assessing throughput, tail latency, and automated fault recovery.`,
      },
    ];

    for (let i = 0; i < finalMulti; i++) {
      let qData;
      if (activeMultiBank && activeMultiBank.length > 0) {
        const item = activeMultiBank[i % activeMultiBank.length];
        const isRepeatedCycle = i >= activeMultiBank.length;
        qData = {
          question: isRepeatedCycle ? `${item.question} (Variation #${Math.floor(i / activeMultiBank.length) + 1})` : item.question,
          options: item.options,
          correctOptions: item.correctOptions,
          explanation: item.explanation,
        };
      } else {
        const tmpl = genericMultiTemplates[i % genericMultiTemplates.length];
        const isRepeatedCycle = i >= genericMultiTemplates.length;
        qData = {
          question: isRepeatedCycle ? `${tmpl.q(cleanTopic)} (Variation #${Math.floor(i / genericMultiTemplates.length) + 1})` : tmpl.q(cleanTopic),
          options: typeof tmpl.opts === 'function' ? tmpl.opts(cleanTopic) : tmpl.opts,
          correctOptions: tmpl.ans,
          explanation: typeof tmpl.exp === 'function' ? tmpl.exp(cleanTopic) : tmpl.exp,
        };
      }

      list.push({
        id: `ms_${qId}`,
        num: qId++,
        type: 'multi-select',
        marks: 2,
        question: qData.question,
        options: qData.options,
        correctOptions: qData.correctOptions,
        explanation: qData.explanation,
      });
    }

    // 3. Generate Short-Answer Questions (with live photo & file upload)
    const quadShortQuestions = [
      'Solve the quadratic equation 2x² - 7x + 3 = 0 using the quadratic formula. State the discriminant D and evaluate both roots step-by-step. You can write your solution on paper and attach via "Live Capture Photo" or "Upload File", or type in the editor.',
      'Explain the geometric relationship between the discriminant b² - 4ac and the number of real x-intercepts of the parabola y = ax² + bx + c. Illustrate three cases (D > 0, D = 0, D < 0). You can sketch on paper or write below.',
    ];
    const newtonShortQuestions = [
      'State Newton’s Second Law in terms of rate of change of linear momentum and mathematically derive F = ma for a system with constant mass. You can write your derivation on paper and snap a photo or type below.',
      'A 10 kg crate rests on a horizontal floor with static friction coefficient μ_s = 0.5. Calculate the minimum horizontal force required to initiate motion (g = 9.8 m/s²). Show all calculation steps.',
    ];
    const aimlShortQuestions = [
      'Explain the difference between Overfitting (High Variance) and Underfitting (High Bias) in machine learning models. Detail two practical techniques to mitigate overfitting.',
      'Describe the core mechanism of Gradient Descent and explain why the selection of learning rate α is critical to algorithm convergence.',
    ];
    const bstShortQuestions = [
      'Derive and illustrate the Left-Right (LR) double rotation on an AVL tree. You can write your step-by-step tree diagram on paper and use "Live Capture Photo" or "Upload File", or type your solution in the editor.',
      'Explain why an Inorder traversal on a Binary Search Tree produces keys in ascending order. State the time complexity and explain the BST invariant.',
    ];
    const thermoShortQuestions = [
      'State the Clausius statement of the Second Law of Thermodynamics and explain why the entropy of an isolated system never decreases. You may write on paper and upload a photo, or type below.',
      'Differentiate between an Isothermal process (dT = 0) and an Adiabatic process (dQ = 0). Write the governing PV relation for each in an ideal gas.',
    ];

    for (let i = 0; i < finalShort; i++) {
      let qText;
      if (isQuad) {
        qText = quadShortQuestions[i % quadShortQuestions.length];
      } else if (isNewton) {
        qText = newtonShortQuestions[i % newtonShortQuestions.length];
      } else if (isAIML) {
        qText = aimlShortQuestions[i % aimlShortQuestions.length];
      } else if (isBST) {
        qText = bstShortQuestions[i % bstShortQuestions.length];
      } else if (isThermo) {
        qText = thermoShortQuestions[i % thermoShortQuestions.length];
      } else {
        const shortPrompts = [
          `Provide a concise analytical explanation of the fundamental governing principles of ${cleanTopic}. You can write formula derivations on paper and use "Live Capture Photo" or "Upload File", or type your response in the editor.`,
          `Discuss the primary operational trade-offs and boundary condition constraints encountered when implementing ${cleanTopic} in production. Write on paper or type below.`,
        ];
        qText = shortPrompts[i % shortPrompts.length];
      }

      list.push({
        id: `short_${qId}`,
        num: qId++,
        type: 'short-answer',
        marks: 3,
        question: qText,
        modelAnswer: `Standard analytical solution for ${cleanTopic}: identify boundary values, establish governing relations, and verify dimensional consistency.`,
        explanation: 'Evaluates conceptual precision, accurate terminology, and clarity of derivation.',
      });
    }

    // 4. Generate Long-Answer / Descriptive Questions (with live photo & file upload)
    for (let i = 0; i < finalLong; i++) {
      let qText;
      if (isQuad) {
        qText = `Provide a rigorous step-by-step mathematical proof of the Quadratic Formula x = (-b ± √(b² - 4ac)) / (2a) starting from the general standard form ax² + bx + c = 0 by completing the square. State all algebraic steps, boundary assumptions (a ≠ 0), and geometric interpretation of the vertex. Write on paper and attach via "Live Capture Photo" or "Upload File".`;
      } else if (isNewton) {
        qText = `Consider a block of mass m sliding down an inclined plane of angle θ with coefficient of kinetic friction μ_k. Draw a complete Free Body Diagram (FBD), resolve all force components along parallel and perpendicular axes, and derive the equation for the acceleration a of the block. Attach your handwritten diagram and derivation via photo or file upload.`;
      } else if (isAIML) {
        qText = `Detail the comprehensive system architecture of a Deep Neural Network (CNN or Transformer). Describe each core component (Self-Attention / Convolution, Activation, Normalization, Loss Function) and explain how Backpropagation computes parameter updates using the chain rule. Attach your handwritten architecture diagram via "Live Capture Photo" or "Upload File".`;
      } else if (isBST) {
        qText = `Provide a rigorous step-by-step mathematical proof of the upper bound height of an AVL tree with N nodes. Illustrate with a detailed Fibonacci AVL tree diagram. Write your derivation on paper and attach via "Live Capture Photo" or "Upload File".`;
      } else if (isThermo) {
        qText = `State both Kelvin-Planck and Clausius formulations of the Second Law and derive the Carnot efficiency formula η = 1 - (Tc / Th) for an ideal gas cycle with complete PV diagrams. Attach your handwritten work with photo/file upload.`;
      } else {
        qText = `Write an exhaustive analytical derivation and system architecture for ${cleanTopic}. Include necessary diagrams, boundary conditions, and real-world engineering trade-offs. Write on paper and attach via "Live Capture Photo" or "Upload File".`;
      }

      list.push({
        id: `long_${qId}`,
        num: qId++,
        type: 'long-answer',
        marks: 5,
        question: qText,
        modelAnswer: `Complete derivation for ${cleanTopic} requires stating foundational differential equations, showing algebraic steps, and evaluating limiting behavior.`,
        explanation: 'Full marks awarded for mathematical completeness, diagram clarity, and accurate physical/algorithmic interpretation.',
      });
    }

    return list;
  });

  const handleSubmit = (finalAnswers, timeSpentSec = 0) => {
    let correctCount = 0;
    const reviewList = [];

    questions.forEach((q) => {
      let isCorrect = false;
      const studentAns = finalAnswers[q.id];

      if (q.type === 'mcq') {
        isCorrect = studentAns === q.correctOption;
      } else if (q.type === 'multi-select') {
        const selected = Array.isArray(studentAns) ? [...studentAns].sort().join(',') : '';
        const target = Array.isArray(q.correctOptions) ? [...q.correctOptions].sort().join(',') : '';
        isCorrect = selected === target;
      } else {
        // Written response: evaluates text and/or attached image
        const studentText =
          typeof studentAns === 'object' && studentAns !== null
            ? studentAns.text || ''
            : typeof studentAns === 'string'
            ? studentAns
            : '';
        const hasAttachedImage =
          typeof studentAns === 'object' && studentAns !== null && Boolean(studentAns.image);

        isCorrect = studentText.trim().length > 15 || hasAttachedImage;
      }

      if (isCorrect) correctCount++;

      const studentText =
        typeof studentAns === 'object' && studentAns !== null ? studentAns.text : studentAns;
      const studentImage =
        typeof studentAns === 'object' && studentAns !== null ? studentAns.image : null;
      const fileName =
        typeof studentAns === 'object' && studentAns !== null ? studentAns.fileName : null;

      reviewList.push({
        question: q.question,
        type: q.type,
        options: q.options,
        studentAnswer: studentText,
        studentImage: studentImage,
        fileName: fileName,
        correctAnswer:
          q.type === 'mcq'
            ? q.correctOption
            : q.type === 'multi-select'
            ? q.correctOptions
            : q.modelAnswer,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const percentage = Math.round((correctCount / questions.length) * 100);

    const resultPayload = {
      id: `practice_${Date.now()}`,
      title: `${(topic || subject || 'general').toLowerCase()} practice`,
      subject: subject || 'General',
      topic: topic || 'Concept Review',
      difficulty: difficulty || 'Medium',
      questionsCount: questions.length,
      score: percentage,
      correctCount,
      totalQuestions: questions.length,
      timeTakenDisplay: isTimed ? `${Math.max(1, Math.round(timeSpentSec / 60))} mins` : 'Self-paced',
      timestampDisplay: 'Just now',
      questions: questions, // Preserves exact questions for Retake / Retest sessions
      review: reviewList,
    };

    onSubmitResult(resultPayload);
  };

  return (
    <InteractiveExamRunner
      examTitle={`${(topic || subject || 'general').toLowerCase()} practice`}
      durationMinutes={isTimed ? durationMinutes : 15}
      questions={questions}
      onClose={onClose}
      onSubmit={handleSubmit}
      isProctored={false}
    />
  );
}
