export interface Board {
  readonly slug: string;
  readonly title: string;
  readonly createdAt: Date;
  readonly postCount: number;
}

interface NewlineNode {
  readonly type: 'newline';
}

interface TextNode {
  readonly type: 'text';
  readonly text: string;
}

interface StyleNode {
  readonly type: 'style';
  readonly style:
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'subscript'
    | 'superscript'
    | 'spoiler'
    | 'code'
    | 'quote'
    | 'color'
    | 'size';
  readonly value: string;
  readonly children: Markup[];
}

interface LinkNode {
  readonly type: 'link';
  readonly url: string;
  readonly text: string;
}

interface RefLinkNode {
  readonly type: 'reflink';
  readonly postID: number;
  readonly threadID?: number;
  readonly slug?: string;
}

interface DiceNode {
  readonly type: 'dice';
  readonly count: number;
  readonly max: number;
  readonly result: number[];
}

export type Markup = NewlineNode | TextNode | StyleNode | LinkNode | RefLinkNode | DiceNode;

export interface File {
  readonly hash: string;
  readonly extension: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly path: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly length: number | null;
  readonly createdAt: Date;

  get isAudioWithoutPreview(): boolean;

  get isTransparent(): boolean;
  get originalUrl(): string;

  get thumbnailWidth(): number;
  get thumbnailHeight(): number;
  get thumbnailUrl(): string;

  get fallbackThumbnailExtension(): string;
  get fallbackThumbnailType(): string;
  get fallbackThumbnailUrl(): string;
}

export interface Thread {
  readonly slug: string;
  readonly id: number;
  readonly subject: string;
  readonly name: string;
  readonly tripcode: string;
  readonly files: File[];
  readonly message: string;
  readonly messageParsed: Markup[];
  readonly createdAt: Date;
  readonly bumpedAt: Date;
  readonly postCount: number;
  readonly replies: Post[];
}

export interface Post {
  readonly slug: string;
  readonly id: number;
  readonly parentId: number;
  readonly name: string;
  readonly tripcode: string;
  readonly files: File[];
  readonly message: string;
  readonly messageParsed: Markup[];
  readonly createdAt: Date;
}
