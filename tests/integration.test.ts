import { makeExecutableSchema } from '@graphql-tools/schema'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { gql } from 'graphql-tag'
import axios from 'axios'
import { applyMiddleware } from '@txo/graphql-middleware'

import { shield, allow, deny } from '../src'

describe('integration tests', () => {
  test('works with ApolloServer', async () => {
    /* Schema */

    const typeDefs = gql`
      type Query {
        allow: String
        deny: String
      }
    `

    const resolvers = {
      Query: {
        allow: () => 'allow',
        deny: () => 'deny',
      },
    }

    /* Permissions */

    const permissions = shield({
      Query: {
        allow: allow,
        deny: deny,
      },
    })

    const server = new ApolloServer({
      schema: applyMiddleware(makeExecutableSchema({ typeDefs, resolvers }), permissions),
    })

    await startStandaloneServer(server, {
      listen: { port: 8008 },
    });
    const url = `http://localhost:8008/`

    /* Tests */

    const query = `
      query {
        allow
        deny
      }
    `

    const res = await axios.post(url, { query })

    expect(res.data.data).toEqual({
      allow: 'allow',
      deny: null,
    })
    expect(res.data.errors.length).toBe(1)

    await server.stop()
  })
})
