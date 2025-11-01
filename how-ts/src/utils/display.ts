/**
 * Display utilities for How-CLI
 */

export function header(): void {
  console.log(
    '   __             \n' +
    '  / /  ___ _    __\n' +
    ' / _ \\/ _ \\ |/|/ /\n' +
    '/_//_/\\___/__,__/ \n'
  );
  console.log('Ask me how to do anything in your terminal!');
}

export function spinner(message: string = 'Generating'): { start: () => void; stop: () => void } {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let currentFrame = 0;
  let intervalId: NodeJS.Timeout | null = null;

  return {
    start: () => {
      intervalId = setInterval(() => {
        process.stdout.write(`\r${frames[currentFrame]} ${message}`);
        currentFrame = (currentFrame + 1) % frames.length;
      }, 100);
    },
    stop: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      process.stdout.write('\r' + ' '.repeat(message.length + 2) + '\r');
    }
  };
}

export async function typewriterEffect(text: string, delay: number = 10): Promise<void> {
  for (const char of text) {
    process.stdout.write(char);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.log(); // New line at the end
}
