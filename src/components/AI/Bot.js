import React from 'react'
import PropTypes from 'prop-types'
import { graphql, ApolloConsumer } from 'react-apollo'
import invokeBot from '../../graphql/queries/invokeBot'
import { createMessage } from '../../graphql/mutations'
import gql from 'graphql-tag'
import lexlogo from '../../images/lexlogo.png'
import uuid from 'uuid/v4'

const QueryMap = [
  { name: 'Developers', slot: 'development' },
  { name: 'Movies', slot: 'movies' },
  { name: 'Science', slot: 'science' },
  { name: 'Music', slot: 'music' },
  { name: 'Food', slot: 'food' }
]
async function lex(client, botName, msg, slot, update) {
  const lex = await client.query({
    query: invokeBot,
    fetchPolicy: 'network-only',
    variables: {
      bot: botName,
      text: `Give me a Chuck Norris ${slot} fact`
    }
  })
  let botResponse = JSON.parse(lex.data.invokeBot.response)
  update({ botResponse })
  console.log('Sending Lex response mutation to backend...')
  const botMessage = {
    input: {
      id: uuid(),
      content: `[${botName}] ${botResponse}`,
      messageConversationId: msg.messageConversationId,
      chatbot: true,
      isSent: true,
      file: null
    }
  }
  await client.mutate({
    mutation: gql`
      ${createMessage}
    `,
    variables: botMessage,
    optimisticResponse: {
      createMessage: {
        __typename: 'Message',
        ...botMessage.input,
        owner: msg.owner,
        isSent: false,
        conversation: {
          __typename: 'Conversation',
          id: msg.messageConversationId,
          name: 'n/a',
          createdAt: 'n/a'
        },
        createdAt: new Date().toISOString()
      }
    }
  })
}

function Bot(props) {
  return (
    <ApolloConsumer>
      {client => (
        <React.Fragment>
          {props.botName === 'ChuckBot' ? (
            <ChuckBot {...props} client={client} />
          ) : (
            <MovieBot {...props} client={client} />
          )}
        </React.Fragment>
      )}
    </ApolloConsumer>
  )
}

function ChuckBot({ msg, update, botName, client }) {
  return (
    <div>
      <div className="text-dark">
        <hr />
      </div>
      <span>
        <small className="float-left">Select the Chuck Norris fact:</small>
      </span>
      <small>
        <button
          type="button"
          className="close text-right"
          aria-label="Close"
          onClick={() => this.setState({ chuckbot: false })}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </small>
      <br />
      <div className="card mx-auto">
        <div className="container p-2">
          <div className="card-header mx-auto text-center text-dark p-0">
            <p>
              <small>
                <i>Powered by:</i>
              </small>
            </p>
            <img
              src={lexlogo}
              alt="Amazon Lex"
              style={{
                width: '75px'
              }}
            />
            <span>
              <small>&</small>
            </span>
            <img
              src="https://assets.chucknorris.host/img/chucknorris_logo_coloured_small@2x.png"
              alt="Powered by chucknorris.io"
              style={{
                width: '75px'
              }}
            />
          </div>
          {QueryMap.map((item, i) => (
            <button
              key={`item-q-${i}`}
              type="button"
              className="btn btn-primary btn-sm btn-block mb-2"
              onClick={() => lex(client, botName, msg, item.slot, update)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

class MovieBot extends React.Component {
  state = { created: false, response: null }
  componentDidMount() {
    const { data: { invokeBot: { response } = {} } = {} } = this.props
    if (response) {
      this.setState({ response }, this.createMessage)
    }
  }

  async componentDidUpdate(prevProps, prevState, snapshot) {
    const {
      data: { invokeBot: { response: oldResponse = null } = {} } = {}
    } = prevProps
    const { data: { invokeBot: { response } = {} } = {} } = this.props

    console.log(oldResponse, response)
    if (!oldResponse && response && !this.state.response) {
      this.setState({ response }, this.createMessage)
    }
  }

  async createMessage() {
    const text = JSON.parse(this.state.response)
    console.log('Movie Lex response:', text)

    const botMessage = {
      input: {
        id: uuid(),
        content: `[${this.props.botName}] ${text}`,
        messageConversationId: this.props.msg.messageConversationId,
        chatbot: true,
        isSent: true,
        file: null
      }
    }

    await this.props.client.mutate({
      mutation: gql`
        ${createMessage}
      `,
      variables: botMessage,
      optimisticResponse: {
        createMessage: {
          __typename: 'Message',
          ...botMessage.input,
          owner: this.props.msg.owner,
          isSent: false,
          conversation: {
            __typename: 'Conversation',
            id: this.props.msg.messageConversationId,
            name: 'n/a',
            createdAt: 'n/a'
          },
          createdAt: new Date().toISOString()
        }
      }
    })
  }

  render() {
    return null
    // let imdbLink
    // let imdbPoster
    // const { botName, data } = this.props
    // console.log(JSON.stringify(data, null, 2))
    // const text = JSON.parse(data.invokeBot.response)
    // console.log(this.props)
    // const expression = /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi
    // const matches = text.match(expression)
    // const withoutLinks = text.split('- IMDB')
    // if (matches) {
    //   imdbLink = matches[0]
    //   imdbPoster = matches[1]
    // }
    // return (
    //   <div>
    //     <div className="bg-primary text-white">
    //       <div className="row">
    //         <div className="col-1 bg-light d-flex align-items-center p-0">
    //           <span className="mx-auto text-dark">
    //             <i className="fas fa-robot" />
    //           </span>
    //         </div>
    //         <div className="col-11">
    //           <strong>
    //             <img
    //               src={lex}
    //               alt="Amazon Lex"
    //               className="p-1"
    //               style={{
    //                 width: '30px'
    //               }}
    //             />
    //             {botName}
    //           </strong>
    //           <p>{withoutLinks[0]}</p>
    //           {matches ? (
    //             <div>
    //               <div className="mx-auto text-center">
    //                 <img src={imdbPoster} alt="Poster" />
    //                 <br />
    //                 <a
    //                   className="text-light"
    //                   href={imdbLink}
    //                   target="_blank noopener noreferrer"
    //                 >
    //                   View on IMDB
    //                 </a>
    //               </div>
    //             </div>
    //           ) : null}
    //         </div>
    //       </div>
    //     </div>
    //     <hr />
    //   </div>
    // )
  }
}

Bot.propTypes = {
  data: PropTypes.object,
  msg: PropTypes.object.isRequired,
  botName: PropTypes.string.isRequired,
  update: PropTypes.func.isRequired
}
ChuckBot.propTypes = {
  msg: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  botName: PropTypes.string.isRequired,
  update: PropTypes.func.isRequired
}
MovieBot.propTypes = {
  data: PropTypes.object,
  msg: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  botName: PropTypes.string.isRequired,
  update: PropTypes.func.isRequired
}
export default graphql(invokeBot, {
  skip: props => !props.msg.content,
  options: props => ({
    fetchPolicy: 'network-only',
    variables: {
      bot: props.botName,
      text: props.msg.content
    }
  })
})(Bot)
