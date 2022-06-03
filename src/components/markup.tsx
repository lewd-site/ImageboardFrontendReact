import { useCallback, MouseEvent } from 'react';
import { Markup as MarkupModel } from '../domain';

export interface MarkupProps {
  readonly markup: MarkupModel[];
  readonly onReflinkClick?: (id: number) => void;
}

export function Markup({ markup, onReflinkClick }: MarkupProps) {
  return (
    <>
      {markup.map((node, index) => {
        switch (node.type) {
          case 'newline':
            return <br key={index} />;

          case 'text':
            return node.text;

          case 'style':
            const children = <Markup markup={node.children} onReflinkClick={onReflinkClick} />;

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

              default:
                console.warn(`Unknown node style: ${node.style}`);
                return children;
            }

          case 'link':
            return (
              <a className="link" href={node.url} target="_blank" rel="ugc" key={index}>
                {node.text}
              </a>
            );

          case 'reflink':
            return <Reflink postID={node.postID} onReflinkClick={onReflinkClick} key={index} />;

          case 'dice':
            const result = node.result.join(', ');

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
  readonly postID: number;
  readonly onReflinkClick?: (id: number) => void;
}

function Reflink({ postID, onReflinkClick }: ReflinkProps) {
  const onClick = useCallback(
    (event: MouseEvent) => {
      if (typeof onReflinkClick !== 'undefined') {
        event.preventDefault();
        onReflinkClick(postID);
      }
    },
    [postID, onReflinkClick]
  );

  return (
    <a className="reflink" href={`#post_${postID}`} rel="ugc" onClick={onClick}>
      &gt;&gt;{postID}
    </a>
  );
}
