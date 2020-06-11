---
title: A Map of Akka
date: "2020-06-11"
description: A Map of Akka 译文
---

令人惊叹的[Akka项目](https://akka.io/)是由Jonas Bonér（译者注：Lightbend的创始人和CTO）在2009年启动的，
目的是将已被证明能提供六个九（99.9999%）甚至更高可用性的[actor模型](https://en.wikipedia.org/wiki/Actor_model)带到JVM上。
Akka是开源的，使用Apache 2许可，提供Java和Scala的API。
如果你对Akka的历史感兴趣，可以看看[Akka 5周年](https://www.lightbend.com/akka-five-year-anniversary)这一博文。

这些年，Akka已经成熟，被广泛使用，
最近甚至获得了2015年[JAX最创新开源技术奖](https://www.lightbend.com/blog/akka-wins-2015-jax-award-for-most-innovative-open-technology)。
Akka已经成长了很多，这可以容易地从[GitHub上根项目](https://github.com/akka/akka)下的子项目数量看出。

为什么要考虑使用Akka？它能提供什么？
在这篇博文中，我们从鸟瞰的角度来看看它最重要的子项目以及它们的功能，以便让你对Akka的整体能力有一个大体了解。
我们正计划（但不承诺）在后续文章中进行一些深入的探讨。

## Akka Actors

akka-actor模块是Akka的核心和灵魂，它是所有其他模块和功能的基础。
本质上，它提供了一个没有任何remoting、cluster awareness、persistence等概念的actor模型的实现。

有趣的是，Jonas Bonér曾经告诉我，
remoting作为[Akka actors](https://blog.codecentric.de/en/2015/08/introduction-to-akka-actors/)的一个组成部分，
永远不会被抽离重构为某个子模块，然而如你所见，事情是会改变的。（译者注：见[akka-remote](https://github.com/akka/akka/tree/master/akka-remote/src)子项目）
不过，Akka actors分布式的设计保留了下来。
在Akka中，所有的东西默认都是分布式的。
网络和它的古怪并没有被隐藏起来，而是被拥抱。

那么，将actors定义为你程序的基本构件的akka-actor给你带来了什么呢？以下是主要特点：
- 通过share-nothing和异步消息传递(asynchronous messaging)来实现松散耦合
- 由于分门别类和授权处理故障，因此具有复原力。
- 由于位置透明(location transparency)而产生的弹性

在我们进一步了解这些功能之前，我们建议阅读[《反应式宣言》](https://www.reactivemanifesto.org/)。
它描述了"现代"系统（例如高可用网站或其它运行重要任务的服务器）的典型要求和特征。
该文档不长，虽然没有进入完全未知的领域，但它定义了一组连贯的用词来谈论当今IT领域的一些重要事情。

让我们回到Akka actors的特点。
在Akka中，所有的东西都是一个actor，而且根据actor模型的发明者Carl Hewitt的说法，"单独一个actor不算是actor"，它们总是以系统的形式出现。
Actors不共享任何东西，也就是说，它们从摒弃了"共享的可变状态"中的"共享"。
从并发的角度看，"共享"是万恶之源。
Actors只通过异步消息进行通信，这个设计与share nothing一起，带来严格的解耦，允许通信的另一方暂时不可用。
这与主流的命令式面向对象编程中常用的同步方法调用形成鲜明对比——该模式下，调用方会一直被阻塞，直至被调用方返回。Ouch!

另一个使用同步方法调用时可能发生的讨厌的事情是异常(exceptions)。
好吧，一方面你知道出了问题。但另一方面，采取行动来解决这个问题成了你的责任。
举个例子。如果有一台自动售货机收了你的钱但没有弹出你要吃的零食，你会怎么做？
或者你会踢售货机，但你肯定不会去修它，那是别人的工作。
你大概率会在吃不到零食的情况下生存下来，或者尝试去找其他能用的售货机。

With actors, in the case of failure, you just don’t get an answer to your message – 
that’s like not getting your snack.
But the failure is delegated to some other actor that supervises the faulty one,
because in Akka every actor has a parent which supervises all its child actors.
It’s the supervisor’s responsibility to decide how to proceed with the faulty actor, e.g. restart or stop it. As a result, communication – sending a message and hoping for a response – is decoupled from failure handling. That means that failure is restricted to the faulty actor and its supervisor and it doesn’t spread towards the caller. In other words, failure is compartmentalized, which means that only a part of the system is affected instead of the whole one.

使用actors这一模式，在(网络)失败(failure)的情况下，你最坏不过收不到回信，就像没有得到你要的零食一样。
对失败的处理会被委托给其它的actor。
在Akka中，每个actor都有一个家长，它监督所有的子actors。
监督者的责任是决定如何对出问题的actors进行处理，例如重启或停止。
因此，通信--发送消息并希望得到响应--与故障处理脱钩。这意味着故障仅限于故障执行者及其主管，而不会向呼叫者扩散。换句话说，故障是分门别类的，这意味着只有系统的一部分受到影响，而不是整个系统。

最后但并非最不重要的一点是，知道一个行动者的物理位置与之对话并不重要，这就是所谓的位置透明。这是因为每个actor都有一个逻辑地址，你可以用来和它对话；它的物理位置对你来说是隐藏的，将你和它解耦。因此，即使一个actor居住在一个远程节点上--这需要使用下面提到的Akka Remoting--有人可以向远程actor的地址发送消息，而不知道这个actor不是本地actor系统的一部分。

综上所述，Akka actor使你能够--虽然是在很低的水平上--写出反应性很强的系统。当然，你需要分布式来实现真正的弹性和可扩展性，但Akka actors带来了所有需要的基础--其余的由其他模块和功能覆盖。

## Akka Remoting

akka-remote是一个极其重要的模块，因为它实现了远程通信和真实位置的透明化。但是除了一些配置设置之外，它保持了后退，基本上是作为一个使能器工作。

如果你想启用远程，你只需要覆盖一些默认的配置设置。
```
akka {
  actor {
    // The default is "akka.actor.LocalActorRefProvider"
    provider = "akka.remote.RemoteActorRefProvider"
  }
  remote {
    netty.tcp {
      hostname = "127.0.0.1" // that's the default
      port     = 9001        // the default is 2552
    }
  }
}
```

基本上，你只需要配置RemoteActorRefProvider。这允许你在远程actor系统上部署actor，包括远程死亡观察、故障检测等。虽然这很奇妙，但对于大多数情况来说，它的水平太低了，因为它要求你知道协作的actor系统的确切远程地址。

## Akka Cluster


这就是[Akka Cluster](https://blog.codecentric.de/en/2016/01/getting-started-akka-cluster/)--它由几个模块组成，例如akka-cluster、akka-cluster-tools或akka-cluster-sharding--进入游戏的地方。它的核心是提供会员服务，允许行为者系统加入和/或离开一个集群。任何行动者都可以注册成为集群事件的监听器，例如MemberUp或MemberRemoved，这使得这些行动者可以动态地获得关于潜在远程通信伙伴的知识。为了提供当前集群状态的一致视图，一个分布式故障检测器监控各个成员节点的健康状况，并可能宣布成员节点无法到达，从而导致UnreachableMember事件。

虽然你可以直接使用集群事件，但你很可能隐性地遇到它们，因为它们是几个更高级别的特性的基础，例如：

- 集群感知路由器：可以在远程成员节点上创建或查找路由。
- 集群单人：集群中只有一个特定角色的实例。
- 集群共享：将潜在的大量角色分布在成员节点上。
- 分布式数据：基于[CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)的一致数据复制，无需中央协调。

## Akka Persistence

行为者被重启的原因有很多，例如，对程序故障（异常）或硬件或网络故障（远程节点不可用）的反应。由于actor完全隐藏了它们的内部状态（如果有的话），因此，在重启后将actor恢复到相同状态的唯一一般方法是通过向它发送像以前一样的消息。

显然，这很适合[Event Sourcing](https://www.martinfowler.com/eaaDev/EventSourcing.html)，而这正是Akka Persistence的目的：通过应用Event Sourcing的概念来恢复角色的状态。因此它区分了命令和事件。如果一个持久化角色收到一个命令，它可能会创建一个事件，要求Akka持久化的日志--有许多日志后端，例如基于Cassandra或Kafka--将其持久化，一旦确认就将事件应用到它的状态。在恢复过程中，所有的事件都会被重放，这就会导致像之前一样的状态。当然也支持快照，避免大量事件的恢复时间过长。

## Akka Streams and Akka HTTP

Akka Streams和Akka HTTP是新来的孩子。它们仍然是实验性的，还不是 "官方 "Akka发行版的一部分，这意味着它们有自己的版本号--写这篇文章的时候是1.0。不过，我们计划让它们成为Akka 2.4的正式公民，2.4应该会在可预见的未来发布。

Akka Streams是[Reactive Streams](http://www.reactive-streams.org/)的一个实现，它已经被包括Reactor、RxJava、Slick和Vert.x在内的许多方指定和实现。Reactive Streams是关于非阻塞背压的异步流处理，Akka Streams--很明显--使用actors来实现。

Akka Streams的一个完美用例是Akka HTTP，它是由非常成功的[spray项目](http://spray.io/)演化而来。一个HTTP服务器接受一个HTTP请求流并产生一个HTTP响应流。同时，HTTP实体的主体基本上是一个甚至多个数据块，可以很好地表达为字节流。

## Conclusion

我们已经概述了几个Akka模块，从非常低级和基本的Akka actors，它们 "简单地 "实现了actor模型，直到高级抽象，如Akka Cluster、Akka Persistence和Akka HTTP，它们都建立在Akka actors提供的基础之上。因此，每一个模块都给你提供了actor模型的好处：松散耦合、弹性和弹性。

如前所述，我们正计划写一些后续文章，更深入地介绍各个模块。我们非常感谢您的问题和反馈。