import { browseAllThreads, browseBoards } from '../api';
import { Board, Thread } from '../domain';
import EventEmitter from '../event-emitter';

export class BoardPageModel extends EventEmitter {
  public static readonly BOARDS_CHANGED = 'BOARDS_CHANGED';
  public static readonly THREADS_CHANGED = 'THREADS_CHANGED';

  protected readonly boards: Map<string, Board> = new Map();
  protected readonly threads: Map<number, Thread> = new Map();

  public constructor(public readonly slug: string) {
    super();
  }

  public load() {
    return Promise.all([
      browseBoards().then((boards) => {
        this.boards.clear();
        for (const board of boards) {
          this.boards.set(board.slug, board);
        }

        this.dispatch(BoardPageModel.BOARDS_CHANGED, [...this.boards.values()]);
      }),
      browseAllThreads(this.slug).then((threads) => {
        this.threads.clear();
        for (const thread of threads) {
          this.threads.set(thread.id, thread);
        }

        this.dispatch(BoardPageModel.THREADS_CHANGED, [...this.threads.values()]);
      }),
    ]);
  }
}

export default BoardPageModel;
