import React, { useContext } from 'react'
import { openAttachmentInShell, onDownload } from '../message/messageFunctions'
import { ScreenContext } from '../../contexts'
import {
  isImage,
  isVideo,
  isAudio,
  getExtension,
  dragAttachmentOut,
} from './Attachment'
import Timestamp from '../conversations/Timestamp'
import { MessageType } from '../../../shared/shared-types'
import { C } from 'deltachat-node/dist/constants'
import { makeContextMenu } from '../ContextMenu'
import { OpenDialogFunctionType } from '../dialogs/DialogController'
import { runtime } from '../../runtime'

export default function MediaAttachment({ message }: { message: MessageType }) {
  if (!message.attachment) {
    return null
  }
  switch (message.viewType) {
    case C.DC_MSG_GIF:
    case C.DC_MSG_IMAGE:
      return <ImageAttachment message={message} />
    case C.DC_MSG_VIDEO:
      return <VideoAttachment message={message} />
    case C.DC_MSG_AUDIO:
    case C.DC_MSG_VOICE:
      return <AudioAttachment message={message} />
    case C.DC_MSG_FILE:
    default:
      return <FileAttachment message={message} />
  }
}

const hideOpenInShellTypes = [
  C.DC_MSG_GIF,
  C.DC_MSG_IMAGE,
  C.DC_MSG_VIDEO,
  C.DC_MSG_AUDIO,
  C.DC_MSG_VOICE,
]

const contextMenuFactory = (
  message: MessageType,
  openDialog: OpenDialogFunctionType
) => {
  const tx = window.static_translate
  const { id: msgId, viewType } = message
  return [
    !hideOpenInShellTypes.includes(viewType) && {
      label: tx('open'),
      action: openAttachmentInShell.bind(null, message),
    },
    {
      label: tx('save'),
      action: onDownload.bind(null, message),
    },
    // {
    //   label: tx('jump_to_message'),
    //   action: ()=>alert('not implemented yet')
    // },
    {
      label: tx('menu_message_details'),
      action: openDialog.bind(null, 'MessageDetail', { id: msgId }),
    },
  ]
}

/** provides a quick link to comonly used functions to save a few duplicated lines  */
const useMediaActions = (message: MessageType) => {
  const { openDialog, openContextMenu } = useContext(ScreenContext)
  return {
    openContextMenu: makeContextMenu(
      contextMenuFactory.bind(null, message, openDialog),
      openContextMenu
    ),
    openFullscreenMedia: openDialog.bind(null, 'FullscreenMedia', {
      msg: message,
    }),
    downloadMedia: onDownload.bind(null, message),
    openInShell: openAttachmentInShell.bind(null, message),
  }
}

function squareBrokenMediaContent(
  hasSupportedFormat: boolean,
  contentType: string
) {
  const tx = window.static_translate
  return (
    <div className='attachment-content'>
      {hasSupportedFormat
        ? tx('attachment_failed_to_load')
        : tx('cannot_display_unsuported_file_type', contentType)}
    </div>
  )
}

function ImageAttachment({ message }: { message: MessageType }) {
  const { openContextMenu, openFullscreenMedia, openInShell } = useMediaActions(
    message
  )
  const { attachment } = message
  const hasSupportedFormat = isImage(attachment)
  const isBroken = !attachment.url || !hasSupportedFormat
  return (
    <div
      className={`media-attachment-media${isBroken ? ` broken` : ''}`}
      onClick={isBroken ? openInShell : openFullscreenMedia}
      onContextMenu={openContextMenu}
    >
      {isBroken ? (
        squareBrokenMediaContent(hasSupportedFormat, attachment.filemime)
      ) : (
        <img
          className='attachment-content'
          src={runtime.transformBlobURL(attachment.url)}
        />
      )}
    </div>
  )
}

function VideoAttachment({ message }: { message: MessageType }) {
  const { openContextMenu, openFullscreenMedia, openInShell } = useMediaActions(
    message
  )
  const { attachment } = message
  const hasSupportedFormat = isVideo(attachment)
  const isBroken = !attachment.url || !hasSupportedFormat
  return (
    <div
      className={`media-attachment-media${isBroken ? ` broken` : ''}`}
      onClick={isBroken ? openInShell : openFullscreenMedia}
      onContextMenu={openContextMenu}
    >
      {isBroken ? (
        squareBrokenMediaContent(hasSupportedFormat, attachment.filemime)
      ) : (
        <>
          <video
            className='attachment-content'
            src={runtime.transformBlobURL(attachment.url)}
            controls={false}
          />
          <div className='video-play-btn'>
            <div className='video-play-btn-icon' />
          </div>
        </>
      )}
    </div>
  )
}

function AudioAttachment({ message }: { message: MessageType }) {
  const { openContextMenu } = useMediaActions(message)
  const { attachment } = message
  const hasSupportedFormat = isAudio(attachment)
  return (
    <div className='media-attachment-audio' onContextMenu={openContextMenu}>
      <div className='heading'>
        <div className='name'>{message?.sender.displayName}</div>
        <Timestamp
          timestamp={message?.timestamp * 1000}
          extended
          module='date'
        />
      </div>
      {hasSupportedFormat ? (
        <audio controls>
          <source src={runtime.transformBlobURL(attachment.url)} />
        </audio>
      ) : (
        <div>
          {window.static_translate(
            'cannot_display_unsuported_file_type',
            attachment.filemime
          )}
        </div>
      )}
    </div>
  )
}

function FileAttachment({ message }: { message: MessageType }) {
  const { openContextMenu, downloadMedia, openInShell } = useMediaActions(
    message
  )
  const { attachment } = message
  const { fileName, fileSize, filemime } = attachment
  const extension = getExtension(attachment)
  return (
    <div
      className='media-attachment-generic'
      role='button'
      onClick={downloadMedia}
      onContextMenu={openContextMenu}
    >
      <div
        className='file-icon'
        draggable='true'
        onClick={ev => {
          ev.stopPropagation()
          openInShell()
        }}
        onDragStart={dragAttachmentOut.bind(null, attachment)}
        title={filemime}
      >
        {extension ? (
          <div className='file-extension'>
            {filemime === 'application/octet-stream' ? '' : extension}
          </div>
        ) : null}
      </div>
      <div className='text-part'>
        <div className='name'>{fileName}</div>
        <div className='size'>{fileSize}</div>
      </div>
    </div>
  )
}
