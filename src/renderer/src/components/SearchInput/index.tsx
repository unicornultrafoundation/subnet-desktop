import { useState } from 'react'
import SearchIcon from '../Icon/SearchIcon'
import Input from '../Input'
import { useDebounce } from '@/hooks/useDebounce'
import { useSearchApp } from '@/hooks/useSearchApps'
import { Link } from 'react-router-dom'
import ImageError from '@/assets/images/image-error.png'
import { formatNumberCompact } from '@/utils'
import { Tooltip } from 'flowbite-react'
import Icon from '../Icon'
import { readableFileSize } from '@/utils/string'

export default function SearchInput() {
  const [focused, setFocused] = useState(false)
  const [query, setQuery] = useState('')

  const debouncedQuery = useDebounce(query, 500)
  const { data: results } = useSearchApp(debouncedQuery)

  return (
    <div className="relative">
      <Input
        id="search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        icon={(props) => {
          return <SearchIcon color={focused ? '#33CC99' : '#E3E3E3'} className={props.className} />
        }}
        placeholder="Search..."
        theme={{
          field: {
            input: {
              withAddon: {
                off: 'rounded-full'
              }
            }
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {results && results.length > 0 && (
        <div className="bg-neutral-1000 rounded-lg p-4 absolute border-[1px] border-neutral-900 w-full mt-8">
          <div className="caption pb-4">Search result ({results.length})</div>
          <div className="flex flex-col w-full gap-4">
            {results.map((item, index) => {
              return (
                <Link
                  key={`search-result-${index}`}
                  to={`/app/${item.id}`}
                  className="w-full flex items-start gap-4 rounded-xl p-4 bg-neutral-900"
                >
                  <img
                    src={item.metadata?.appInfo?.logo}
                    alt=""
                    className="w-10 h-10"
                    onError={(e) => {
                      e.currentTarget.src = ImageError
                    }}
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="title-lg">{item.name}</div>
                    <p className="text-[12px] leading-4 text-[#ffffff99] mb-2 mt-1">
                      {formatNumberCompact(Number(BigInt(item.node_count || 0)))} Download
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Icon name="network" className="size-4" />
                        <Tooltip content="Minimum download bandwith">
                          <p className="text-[12px]">
                            {BigInt(item.min_download_bandwidth).toString()} ms
                          </p>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="ram" className="size-4" />
                        <Tooltip content="Minimum memory">
                          <p className="text-[12px]">
                            {readableFileSize(Number(BigInt(item.min_memory)))}
                          </p>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="cpu" className="size-4" />
                        <Tooltip content="Minimum CPU">
                          <p className="text-[12px]">
                            {readableFileSize(Number(BigInt(item.min_cpu)))}
                          </p>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
