import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const regex = /\b(nrk[s]*.*?sjakk\w*)\b/

    const postsToCreate = ops.posts.creates
      .filter((create) => {
        const text = create.record.text.toLowerCase()
        const altText = Array.isArray(create.record.embed?.images)
          ? create.record.embed.images.map((img) => img.alt).join(' ')
          : ''

        // Check if either text or altText matches the pattern
        const isNrksjakkPost = regex.test(text) || regex.test(altText)
        if (isNrksjakkPost) {
          console.log(`Found nrksjakk-related post: ${text || altText}`)
        }
        return isNrksjakkPost
      })
      .map((create) => {
        // map nrksjakk-related posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
