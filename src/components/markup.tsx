import { Link } from '@tanstack/react-location';
import { useCallback, MouseEvent } from 'react';
import { Markup as MarkupModel } from '../domain';
import { cls } from '../utils';

export interface MarkupProps {
  readonly markup: MarkupModel[];
  readonly ownPostIds?: number[];
}

export function Markup({ markup, ownPostIds }: MarkupProps) {
  return (
    <>
      {markup.map((node, index) => {
        switch (node.type) {
          case 'newline':
            return <br key={index} />;

          case 'text':
            return node.text;

          case 'style':
            const children = <Markup markup={node.children} ownPostIds={ownPostIds} />;

            switch (node.style) {
              case 'bold':
                return (
                  <strong className="bold" key={index}>
                    {children}
                  </strong>
                );

              case 'italic':
                return (
                  <em className="italic" key={index}>
                    {children}
                  </em>
                );

              case 'underline':
                return (
                  <span className="underline" key={index}>
                    {children}
                  </span>
                );

              case 'strike':
                return (
                  <del className="strike" key={index}>
                    {children}
                  </del>
                );

              case 'subscript':
                return (
                  <sub className="subscript" key={index}>
                    {children}
                  </sub>
                );

              case 'superscript':
                return (
                  <sup className="superscript" key={index}>
                    {children}
                  </sup>
                );

              case 'spoiler':
                return (
                  <span className="spoiler" key={index}>
                    {children}
                  </span>
                );

              case 'code':
                return (
                  <code className="code" key={index}>
                    {children}
                  </code>
                );

              case 'quote':
                return (
                  <span className="quote" key={index}>
                    {children}
                  </span>
                );

              case 'color':
                return (
                  <span className="color" style={{ color: node.value }} key={index}>
                    {children}
                  </span>
                );

              case 'size':
                return (
                  <span className="size" style={{ fontSize: `${node.value}px` }} key={index}>
                    {children}
                  </span>
                );

              default:
                console.warn(`Unknown node style: ${node.style}`);
                return children;
            }

          case 'link':
            const target = node.url.match(`^(?:https?:\/\/)?(?:www\.)?youtube\.com`) !== null ? 'youtube' : '_blank';

            return (
              <a className="link" href={node.url} target={target} rel="ugc" key={index}>
                {node.text}
              </a>
            );

          case 'reflink':
            return (
              <Reflink
                key={index}
                postID={node.postID}
                threadID={node.threadID}
                slug={node.slug}
                ownPostIds={ownPostIds}
              />
            );

          case 'dice':
            let result = node.result.join(', ');
            if (node.result.length > 1) {
              const min = Math.min(...node.result);
              const max = Math.max(...node.result);

              let avg = node.result.reduce((prev, curr) => prev + curr, 0) / node.result.length;
              avg = Number(avg.toFixed(2));

              result += ` (min: ${min}, max: ${max}, avg: ${avg})`;
            }

            return (
              <span className="dice" key={index}>
                ##{node.count}d{node.max}## = {result}
              </span>
            );

          default:
            console.warn(`Unknown node type: ${(node as any).type}`);
            return <></>;
        }
      })}
    </>
  );
}

interface ReflinkProps {
  readonly slug?: string;
  readonly threadID?: number;
  readonly postID: number;
  readonly ownPostIds?: number[];
}

function Reflink({ postID, threadID, slug, ownPostIds }: ReflinkProps) {
  const url = typeof threadID !== 'undefined' && typeof slug !== 'undefined' ? `/${slug}/res/${threadID}` : '.';

  return (
    <Link
      className={cls(['reflink', ownPostIds?.includes(postID) && 'reflink_own'])}
      to={url}
      hash={`post_${postID}`}
      rel="ugc"
    >
      &gt;&gt;{postID}
    </Link>
  );
}
