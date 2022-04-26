export interface Runnable {
  /**
   * @param args the command that is actually run when invoked. Should return 0 for success, and any other number for a failure.
   */
  run(...args: unknown[]): Promise<number>;
}

export interface RunnableConstructor {
  new (...args: unknown[]): Runnable;
}
