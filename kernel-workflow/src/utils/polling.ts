export async function poll<T>(
  fn: Function,
  fnCondition: Function,
  ms: number
): Promise<T> {
  let result = await fn();
  while (fnCondition(result)) {
    await wait(ms);
    result = await fn();
  }
  return result;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
