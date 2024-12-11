import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import { log } from './util/logger'

enum PostType {
  nrksjakk = 'nrksjakk',
}

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)
    const postToPostType: Record<string, string> = {}
    const regex = /\b(nrk[s]*.*?sjakk\w*)\b/

    function filterPosts(
      post: (typeof ops.posts.creates)[0],
      regex: RegExp,
    ): boolean {
      const text = post.record.text.toLowerCase()
      const altText = Array.isArray(post.record.embed?.images)
        ? post.record.embed.images
            .map((img: { alt: string }) => img.alt)
            .join(' ')
            .toLowerCase()
        : ''
      return regex.test(text) || regex.test(altText)
    }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)

    const postsToCreate = ops.posts.creates
      .filter((create) => {
        const isNrksjakkPost = filterPosts(create, regex)
        if (isNrksjakkPost) {
          postToPostType[create.uri] = PostType.nrksjakk
          log.info(`Found nrksjakk-related post: ${create.uri}`)
        }
        return isNrksjakkPost
      })
      .map((create) => {
        // map posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
          contentType: postToPostType[create.uri],
        }
      })

    if (postsToDelete.length > 0) {
      const deleted = await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
        .then((res) => res.at(0)?.numDeletedRows)
      deleted ? deleted > 0 && log.info(`Deleted ${deleted} posts`) : null
    }
    if (postsToCreate.length > 0) {
      const created = await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
        .then((res) => res.at(0)?.numInsertedOrUpdatedRows)
      created ? created > 0 && log.info(`Inserted ${created} posts`) : null
    }
  }
}
