export function promiseSerial(tasks: Array<() => Promise<any>>) {
  return tasks.reduce(
    (promise, currentTask) =>
      promise.then(result =>
        currentTask().then(Array.prototype.concat.bind(result))
      ),
    Promise.resolve([])
  );
}
