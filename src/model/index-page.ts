import { browseBoards } from '../api';
import cache from '../cache';
import { Board } from '../domain';
import EventEmitter from '../event-emitter';

export class IndexPageModel extends EventEmitter {
  public static readonly BOARDS_CHANGED = 'BOARDS_CHANGED';

  protected readonly boards: Map<string, Board>;

  public constructor() {
    super();

    this.boards = cache.getBoards();
  }

  public async load() {
    const boards = await browseBoards();
    this.boards.clear();
    for (const board of boards) {
      this.boards.set(board.slug, board);
    }

    cache.setBoards(this.boards);
    this.dispatch(IndexPageModel.BOARDS_CHANGED, [...this.boards.values()]);
  }
}

export default IndexPageModel;
