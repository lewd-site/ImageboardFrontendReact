import { browseAllThreads, browseBoards } from '../api';
import cache from '../cache';
import { Board, Thread } from '../domain';
import EventEmitter from '../event-emitter';

export class BoardPageModel extends EventEmitter {
  public static readonly BOARDS_CHANGED = 'BOARDS_CHANGED';
  public static readonly THREADS_CHANGED = 'THREADS_CHANGED';

  protected readonly boards: Map<string, Board>;
  protected readonly threads: Map<number, Thread>;

  public constructor(public readonly slug: string) {
    super();

    this.boards = cache.getBoards();
    this.threads = cache.getThreads(slug);
  }

  public load() {
    return Promise.all([
      browseBoards().then((boards) => {
        this.boards.clear();
        for (const board of boards) {
          this.boards.set(board.slug, board);
        }

        cache.setBoards(this.boards);
        this.dispatch(BoardPageModel.BOARDS_CHANGED, [...this.boards.values()]);
      }),
      browseAllThreads(this.slug).then((threads) => {
        this.threads.clear();
        for (const thread of threads) {
          this.threads.set(thread.id, thread);
        }

        cache.setThreads(this.slug, this.threads);
        this.dispatch(BoardPageModel.THREADS_CHANGED, [...this.threads.values()]);
      }),
    ]);
  }
}

export default BoardPageModel;
