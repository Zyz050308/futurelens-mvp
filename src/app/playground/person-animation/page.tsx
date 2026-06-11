import PersonAnimationCanvas from '@/components/PersonAnimationCanvas';

export default function Page() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#05070A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      margin: 0,
    }}>
      <div style={{
        position: 'relative',
        width: 'min(96vw, 680px)',
        height: 'min(92vh, 760px)',
        aspectRatio: '680 / 760',
      }}>
        <PersonAnimationCanvas />
      </div>
    </main>
  );
}
