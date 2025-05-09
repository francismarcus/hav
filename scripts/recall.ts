import { recallEval } from '@/lib/ai/evals/recall';
import { retriever } from '@/lib/ai/query-expansion';

/*
 For third sample window expansion might be needed
*/
const sample = [
  {
    question: 'What pay can I expect as an AI engineer?',
    reference: 'a $200k+ career in tech',
  },
  {
    question: 'What are some possible jobs from the programs?',
    reference:
      'Machine Learning Engineer, Deep Learning Engineer, Artificial Intelligence Specialist, and Quantitative Analyst',
  },
  {
    question:
      'What are the steps to become a Deep Learning Engineer? and how long does it take?',
    reference:
      'Step 1. AI Programming with Python 73 hours\nStep 2. AWS Machine Learning Engineer 94 hours\nStep 3. Deep Learning 61 hours.',
  },
  {
    question:
      'I am very interested in self-driving cars and things like that, do you have anything programs in that area?',
    reference:
      'Self-Driving Car Engineer, Robotics Software Engineer, Sensor Fusion, Flying Car and Autonomous Flight Engineer, and Introduction to Self-Driving Cars',
  },
  {
    question: 'What will I learn in the sensor fusion program?',
    reference:
      'the fundamentals of sensor fusion and perception for self-driving cars. The program covers lidar, radar, camera, and Kalman filters, and includes lessons on working with real-world data, filtering, segmentation, clustering, and object tracking',
  },
];

async function evaluate() {
  for (const test of sample) {
    const result = await recallEval(test, (question) => retriever(question));
    console.log(
      'Question --->',
      test.question,
      'Score --->',
      result.score,
      'Explanation --->',
      result.explanation
    );
  }

  process.exit(0);
}

evaluate();
