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

    // Detect subject domains
    const isBST = cleanTopic.toLowerCase().includes('tree') || cleanTopic.toLowerCase().includes('bst') || cleanTopic.toLowerCase().includes('graph');
    const isThermo = cleanTopic.toLowerCase().includes('thermo') || cleanTopic.toLowerCase().includes('heat') || cleanTopic.toLowerCase().includes('physic');

    // 1. Generate Single-Select MCQ Questions
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
    ];

    for (let i = 0; i < finalMcq; i++) {
      let qData;
      if (isBST) {
        qData = bstMcqBank[i % bstMcqBank.length];
      } else if (isThermo) {
        qData = thermoMcqBank[i % thermoMcqBank.length];
      } else {
        qData = {
          question: `In ${cleanSubject} &bull; ${cleanTopic}, which governing law or fundamental principle forms the core foundation of problem set #${i + 1}?`,
          options: [
            `Deterministic state conservation and boundary condition invariants in ${cleanTopic}`,
            `Arbitrary empirical heuristic with unconstrained variable divergence`,
            `Zero-order constant assumption neglecting all external force vectors`,
            `Asymptotic non-convergent random distribution model`,
          ],
          correctOption: 0,
          explanation: `Under standard core tenets of ${cleanTopic}, conservation principles and invariant boundary constraints dictate deterministic system stability.`,
        };
      }

      list.push({
        id: `mcq_${qId}`,
        num: qId++,
        type: 'mcq',
        marks: 1,
        question: i >= (isBST ? bstMcqBank.length : isThermo ? thermoMcqBank.length : 1)
          ? `${qData.question} (Variation #${Math.floor(i / 3) + 1})`
          : qData.question,
        options: qData.options,
        correctOption: qData.correctOption,
        explanation: qData.explanation,
      });
    }

    // 2. Generate Multi-Select Questions
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

    for (let i = 0; i < finalMulti; i++) {
      let qData;
      if (isBST) {
        qData = bstMultiBank[i % bstMultiBank.length];
      } else if (isThermo) {
        qData = thermoMultiBank[i % thermoMultiBank.length];
      } else {
        qData = {
          question: `Select all valid conditions, properties, or axioms that apply to ${cleanTopic} under ${difficulty} scenarios (Set #${i + 1}):`,
          options: [
            `Deterministically preserves state stability within defined boundary tolerances`,
            `Enforces strict mathematical verification of input invariants before state transition`,
            `Violates energy conservation laws under standard room conditions`,
            `Enables modular composition and predictable analytical outcomes`,
          ],
          correctOptions: [0, 1, 3],
          explanation: `Options A, B, and D represent fundamental properties of robust ${cleanTopic} systems. Option C violates standard scientific conservation laws.`,
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
    for (let i = 0; i < finalShort; i++) {
      const qText = isBST
        ? `Derive and illustrate the Left-Right (LR) double rotation on an AVL tree (Part #${i + 1}). You can write your step-by-step derivation and tree diagram on paper and use "Live Capture Photo" or "Upload File", or type your solution in the editor.`
        : isThermo
        ? `State the Clausius statement of the Second Law of Thermodynamics and explain why entropy of an isolated system never decreases (Part #${i + 1}). You may write on paper and capture/upload photo, or type below.`
        : `Provide a concise explanation of the core theorem governing ${cleanTopic} (Question #${i + 1}). You can write your formula derivations on paper and use "Live Capture Photo" or "Upload File", or type your response in the editor.`;

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
      const qText = isBST
        ? `Provide a rigorous step-by-step mathematical proof of the upper bound height of an AVL tree with N nodes. Illustrate with a detailed Fibonacci AVL tree diagram. Write your derivation on paper and attach via "Live Capture Photo" or "Upload File".`
        : isThermo
        ? `State both Kelvin-Planck and Clausius formulations of the Second Law and derive the Carnot efficiency formula η = 1 - (Tc / Th) for an ideal gas cycle with complete PV diagrams. Attach your handwritten work with photo/file upload.`
        : `Write an exhaustive analytical derivation and system architecture for ${cleanTopic}. Include necessary diagrams, boundary conditions, and real-world engineering trade-offs. Write on paper and attach via "Live Capture Photo" or "Upload File".`;

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
