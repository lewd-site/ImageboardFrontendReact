import { Board, Post, Thread } from './domain';

export class Cache {
  protected boards: Map<string, Board> = new Map();
  protected threadsPerBoard: Map<string, Map<number, Thread>> = new Map();
  protected postsPerThread: Map<string, Map<number, Post>> = new Map();

  public getBoards(): Map<string, Board> {
    return new Map(this.boards);
  }

  public setBoards(boards: Map<string, Board>) {
    this.boards = new Map(boards);
  }

  public getThreads(slug: string): Map<number, Thread> {
    const threads = this.threadsPerBoard.get(slug);
    if (typeof threads === 'undefined') {
      return new Map();
    }

    return new Map(threads);
  }

  public setThreads(slug: string, threads: Map<number, Thread>) {
    this.threadsPerBoard.set(slug, new Map(threads));
  }

  public getPosts(slug: string, parentId: number): Map<number, Post> {
    const key = `${slug}/${parentId}`;
    const posts = this.postsPerThread.get(key);
    if (typeof posts === 'undefined') {
      return new Map();
    }

    return new Map(posts);
  }

  public setPosts(slug: string, parentId: number, posts: Map<number, Post>) {
    const key = `${slug}/${parentId}`;
    this.postsPerThread.set(key, new Map(posts));
  }
}

export const cache = new Cache();

export default cache;
