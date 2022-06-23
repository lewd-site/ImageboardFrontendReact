import { browseBoards } from '../api';
import { Board } from '../domain';
import EventEmitter from '../event-emitter';

export class IndexPageModel extends EventEmitter {
  public static readonly BOARDS_CHANGED = 'BOARDS_CHANGED';

  protected readonly boards: Map<string, Board> = new Map();

  public async load() {
    const boards = await browseBoards();
    this.boards.clear();
    for (const board of boards) {
      this.boards.set(board.slug, board);
    }

    this.dispatch(IndexPageModel.BOARDS_CHANGED, [...this.boards.values()]);
  }
}

export default IndexPageModel;
