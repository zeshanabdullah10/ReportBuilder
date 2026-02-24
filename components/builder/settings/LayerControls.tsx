'use client'

import { useEditor } from '@craftjs/core'
import { ChevronsUp, ChevronUp, ChevronDown, ChevronsDown, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LayerControls() {
  const { selected, actions, query } = useEditor((state, query) => {
    const [currentNodeId] = state.events.selected
    let selected = null

    if (currentNodeId) {
      const node = state.nodes[currentNodeId]
      selected = {
        id: currentNodeId,
        zIndex: node.data.props?.zIndex || 1,
        visible: node.data.props?.visible !== false,
      }
    }

    return { selected }
  })

  if (!selected) return null

  const handleBringToFront = () => {
    // Get all z-indices and find the max
    const nodes = query.getSerializedNodes()
    let maxZ = 1
    Object.values(nodes).forEach((node: any) => {
      if (node.props?.zIndex && node.props.zIndex > maxZ) {
        maxZ = node.props.zIndex
      }
    })

    actions.setProp(selected.id, (props: any) => {
      props.zIndex = maxZ + 1
    })
  }

  const handleBringForward = () => {
    actions.setProp(selected.id, (props: any) => {
      props.zIndex = (props.zIndex || 1) + 1
    })
  }

  const handleSendBackward = () => {
    actions.setProp(selected.id, (props: any) => {
      props.zIndex = Math.max(1, (props.zIndex || 1) - 1)
    })
  }

  const handleSendToBack = () => {
    actions.setProp(selected.id, (props: any) => {
      props.zIndex = 1
    })
  }

  const handleToggleVisibility = () => {
    actions.setProp(selected.id, (props: any) => {
      props.visible = !props.visible
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500 uppercase tracking-wide">
          Layer Order
        </label>
        <span className="text-xs text-gray-400 font-mono">
          z: {selected.zIndex}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBringToFront}
          title="Bring to Front"
          className="h-8 w-8 p-0 border-[rgba(0,255,200,0.2)] hover:bg-[rgba(0,255,200,0.1)] hover:border-[#00ffc8]"
        >
          <ChevronsUp className="w-4 h-4 text-gray-400" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleBringForward}
          title="Bring Forward"
          className="h-8 w-8 p-0 border-[rgba(0,255,200,0.2)] hover:bg-[rgba(0,255,200,0.1)] hover:border-[#00ffc8]"
        >
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendBackward}
          title="Send Backward"
          className="h-8 w-8 p-0 border-[rgba(0,255,200,0.2)] hover:bg-[rgba(0,255,200,0.1)] hover:border-[#00ffc8]"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendToBack}
          title="Send to Back"
          className="h-8 w-8 p-0 border-[rgba(0,255,200,0.2)] hover:bg-[rgba(0,255,200,0.1)] hover:border-[#00ffc8]"
        >
          <ChevronsDown className="w-4 h-4 text-gray-400" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleVisibility}
          title={selected.visible ? 'Hide Component' : 'Show Component'}
          className={`h-8 w-8 p-0 border-[rgba(0,255,200,0.2)] hover:bg-[rgba(0,255,200,0.1)] hover:border-[#00ffc8] ${!selected.visible ? 'bg-[rgba(0,255,200,0.1)]' : ''}`}
        >
          {selected.visible ? (
            <Eye className="w-4 h-4 text-[#00ffc8]" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-500" />
          )}
        </Button>
      </div>
    </div>
  )
}
