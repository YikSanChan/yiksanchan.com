/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"

import { rhythm } from "../utils/typography"

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      avatar: file(absolutePath: { regex: "/profile-pic.jpg/" }) {
        childImageSharp {
          fixed(width: 50, height: 50) {
            ...GatsbyImageSharpFixed
          }
        }
      }
      site {
        siteMetadata {
          author {
            name
          }
          social {
            github
            stackoverflow
            twitter
          }
        }
      }
    }
  `)

  const { author, social } = data.site.siteMetadata
  return (
    <div
      style={{
        display: `flex`,
        marginBottom: rhythm(2.5),
      }}
    >
      <Image
        fixed={data.avatar.childImageSharp.fixed}
        alt={author.name}
        style={{
          marginRight: rhythm(1 / 2),
          marginBottom: 0,
          minWidth: 50,
          borderRadius: `100%`,
        }}
        imgStyle={{
          borderRadius: `50%`,
        }}
      />
      <p>
        我是{author.name}，在 <a href={`https://code.tubitv.com/`}>Tubi</a> 用 Akka 搭建 ad server。
        我活跃在{` `}
        <a href={`https://github.com/${social.github}`}>Github</a>，
        <a href={`https://stackoverflow.com/users/${social.stackoverflow}`}>Stack Overflow</a> 和{` `}
        <a href={`https://twitter.com/${social.twitter}`}>Twitter</a>。
        Akka 是我分布式系统的启蒙，我将在本博客中记录有关 Akka 的一些思考。
      </p>
    </div>
  )
}

export default Bio
