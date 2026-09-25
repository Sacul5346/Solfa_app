import ExerciseQCM from '../components/ExerciseQCM';

export default function ExercisePage() {
  return (
    <section className="page-content">
      <p className="eyebrow">Oreille musicale</p>
      <h1>Exercice QCM</h1>
      <p className="page-intro">Écoute une note, retrouve sa syllabe et suis ton score.</p>
      <ExerciseQCM />
    </section>
  );
}
