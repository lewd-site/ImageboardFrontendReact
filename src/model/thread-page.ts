import { browseBoards, browsePosts, readThread } from '../api';
import cache from '../cache';
import { Board, Post, Thread } from '../domain';
import EventEmitter from '../event-emitter';
import { SseThreadUpdater, ThreadUpdater } from '../updater';

export class ThreadPageModel extends EventEmitter {
  public static readonly BOARDS_CHANGED = 'BOARDS_CHANGED';
  public static readonly THREAD_CHANGED = 'THREAD_CHANGED';
  public static readonly POSTS_CHANGED = 'POSTS_CHANGED';
  public static readonly UNREAD_POSTS_COUNT_CHANGED = 'UNREAD_POSTS_COUNT_CHANGED';

  protected readonly boards: Map<string, Board>;
  protected thread: Thread | null;
  protected readonly posts: Map<number, Post>;

  protected readonly updater: ThreadUpdater;

  protected unreadPostsCount = 0;

  public constructor(public readonly slug: string, public readonly parentId: number) {
    super();

    this.boards = cache.getBoards();
    this.thread = cache.getThread(slug, parentId);
    this.posts = cache.getPosts(slug, parentId);

    this.updater = new SseThreadUpdater(this.slug, this.parentId);
    this.updater.subscribe(this.onThreadUpdated);
  }

  public load() {
    this.unreadPostsCount = 0;

    this.dispatch(ThreadPageModel.UNREAD_POSTS_COUNT_CHANGED, this.unreadPostsCount);

    return Promise.all([
      browseBoards().then((boards) => {
        this.boards.clear();
        for (const board of boards) {
          this.boards.set(board.slug, board);
        }

        cache.setBoards(this.boards);
        this.dispatch(ThreadPageModel.BOARDS_CHANGED, [...this.boards.values()]);
      }),
      readThread(this.slug, this.parentId).then((thread) => {
        this.thread = thread;
        cache.setThread(this.slug, thread);
        this.dispatch(ThreadPageModel.THREAD_CHANGED, this.thread);
      }),
      browsePosts(this.slug, this.parentId).then((posts) => {
        this.posts.clear();
        for (const post of posts) {
          this.posts.set(post.id, post);
        }

        cache.setPosts(this.slug, this.parentId, this.posts);
        this.dispatch(ThreadPageModel.POSTS_CHANGED, [...this.posts.values()]);
      }),
    ]);
  }

  protected onThreadUpdated = (newPosts: Post[]) => {
    let newPostCount = 0;
    for (const post of newPosts) {
      if (!this.posts.has(post.id)) {
        newPostCount++;
      }

      for (const ref of post.references) {
        const target = this.posts.get(ref.targetId);
        if (typeof target !== 'undefined' && target.referencedBy.findIndex((r) => r.sourceId === ref.sourceId) === -1) {
          target.referencedBy.push({
            targetId: target.id,
            targetParentId: target.parentId,
            sourceId: post.id,
            sourceParentId: post.parentId,
          });
        }
      }

      this.posts.set(post.id, post);
    }

    cache.setPosts(this.slug, this.parentId, this.posts);
    this.dispatch(ThreadPageModel.POSTS_CHANGED, [...this.posts.values()]);

    if (newPostCount > 0 && document.hidden) {
      this.dispatch(ThreadPageModel.UNREAD_POSTS_COUNT_CHANGED, (this.unreadPostsCount += newPostCount));
    }
  };

  public resetUnreadCount() {
    this.dispatch(ThreadPageModel.UNREAD_POSTS_COUNT_CHANGED, (this.unreadPostsCount = 0));
  }

  public dispose() {
    this.updater.dispose();
  }
}

export default ThreadPageModel;
