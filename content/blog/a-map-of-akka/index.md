---
title: A Map of Akka
date: "2020-06-12"
description: A Map of Akka by Heiko Seeberger 译文
---

**译者的话**

[A Map of Akka](https://blog.codecentric.de/en/2015/07/a-map-of-akka/)是[Heiko Seeberger](https://github.com/hseeberger)
于2015年写的一篇文章，简明扼要地介绍了Akka各模块间的内在逻辑联系。5年后的今天，Akka最核心的模块仍旧是这几个，内在逻辑也几乎没变。
我希望这篇文章能作为一张地图，让还没有使用过Akka的读者得以初识Akka全貌，也让正在使用Akka的读者不至于迷失在浩如烟海的官方文档中。

Heiko是Akka的早期贡献者，也是Scala社区的重要贡献者。
我有幸与Heiko在[Tubi](https://tubitv.com/)短暂共事，得到了他的许多帮助。
即使在他回到Lightbend担任[Cloudstate](https://cloudstate.io/)项目的Tech Lead后，他仍会在Github上解答我的问题。
本文的翻译得到了Heiko的同意，我在此特意感谢他对我的帮助，祝他能带队把Cloudstate做成功。
翻译大幅借助于[DeepL Translate](https://www.deepl.com/en/translator)，感谢这个工具。

Heiko, thanks for always helping me with Akka. Happy Hakking!

---

[actor模型](https://en.wikipedia.org/wiki/Actor_model)已被证明能提供六个九(99.9999%)及以上的可用性。
Jonas Bonér(译者注：Lightbend的创始人和CTO)在2009年启动[Akka项目](https://akka.io/)，想把actor模型带到JVM。
Akka是开源的，使用Apache 2许可，提供Java和Scala的API。
如果你对Akka的历史感兴趣，可以看看[Akka 5周年](https://www.lightbend.com/akka-five-year-anniversary)这一博文。

这些年，Akka愈发成熟，被广泛使用，
最近还获得了2015年[JAX最创新开源技术奖](https://www.lightbend.com/blog/akka-wins-2015-jax-award-for-most-innovative-open-technology)。
Akka的成长可以容易地从[GitHub上根项目](https://github.com/akka/akka)下的子项目数量看出。

为什么要考虑使用Akka？它能提供什么？
本文从鸟瞰的角度来看看它最重要的模块以及它们的功能，以便让你对Akka的整体能力有一个大体了解。
我们计划(但不承诺)在后续文章中进行深入探讨。

## Akka Actors

akka-actor模块是Akka的核心和灵魂，它是所有其它模块和功能的基础。
本质上，它实现了actor模型，而不涉及任何remoting、cluster awareness、persistence等概念。

有趣的是，Jonas Bonér曾经告诉我，remoting永远不会脱离[Akka actors](https://blog.codecentric.de/en/2015/08/introduction-to-akka-actors/)
而成为一个独立的模块，然而如你所见，事情是会改变的
(译者注：见[akka-remote](https://github.com/akka/akka/tree/master/akka-remote/src) 模块)。
不过，分布式的设计在Akka actors保留了下来。
在Akka中，所有的东西默认都是分布式的。
这种设计直面了网络的古怪之处。

akka-actor将actors作为程序的基本构件，带来以下好处：
- 松散耦合(loose coupling)：得益于share-nothing和异步消息传递(asynchronous messaging)。
- 可恢复性(resilience)：得益于对故障的分类和授权处理。
- 弹性(elasticity)：得益于位置透明(location transparency)。

在进一步了解这些功能之前，建议阅读[《响应式宣言》](https://www.reactivemanifesto.org/)，
它描述了"现代"系统(例如高可用网站或其它运行重要任务的服务器)的典型要求和特征。
这篇文档不长，定义了一套条理清晰的用语来谈论当今IT领域的一些重要事情。

回到Akka actors的特点。
在Akka中，所有的东西都是一个actor。根据actor模型的发明者Carl Hewitt的说法，"单独的actor不算是actor"，它们总是以系统(译者注：ActorSystem)的形式出现。
Actors之间不共享任何东西，也就是说，它们摒弃了"共享的可变状态"中的"共享"(从并发的角度看，"共享"是万恶之源)。
Actors只通过异步消息进行通信，这个设计与share-nothing一起带来的松散耦合允许通信的另一方暂时不可用。
这与主流的命令式面向对象编程中常用的同步方法调用(synchronous method calls)形成鲜明对比。
在这种模式下，调用方会一直被阻塞，直至被调用方返回。Ouch!

在同步方法调用中处理异常(exceptions)也很烦人。
你知道别处出了问题，而你还得负责处理(即便这个问题本不是你的锅)。
举个例子。假设有一台自动售货机收了你的钱但没有弹出你要吃的零食，你会怎么做？
或者你会踢这台售货机，但你肯定不会去修它，那是别人的工作。
你大概率会在吃不到零食的情况下活下来，或者尝试去找其它能用的售货机。

使用actors这一模式，在(网络)故障(failure)的情况下，你最差不过收不到回信，就像没有得到你想要的零食一样。
对失败的处理会被委托给其它的actor。
在Akka中，每个actor都有一个家长，它监督所有的子actors。
监督者的职责是处理出问题的actors，例如重启或停止。
因此，通信(发送消息并希望得到响应)与故障处理脱钩。这意味着故障仅限于出错的actor及其监督者，而不会向调用方扩散。
换句话说，故障只影响系统的一部分，而非整个系统。

最后，要与一个actor进行对话并不需要知道对方的物理位置，这就是所谓的位置透明。
这是因为每个actor都有一个逻辑地址用于与你通信，而隐藏了它的物理位置，将你和它解耦。
因此，即使一个actor实际位于一个远程节点上(这需要使用下面提到的Akka Remoting)，
你仍可以向远程actor发送消息，而无需知道这个actor是否是本地actor系统的一部分。

综上所述，Akka actors提供了很底层(low level)的工具，让你能够写出非常响应式(reactive)的系统。
当然，你需要分布式来实现真正具有弹性和可扩展性的系统，Akka actors提供了所有需要的基础，剩下的由其它模块和功能负责。

## Akka Remoting

akka-remote是一个极其重要的模块，因为它使得远程通信和真实位置的透明化成为可能。
听上去会比较复杂，但实际使用起来只需要配置一下。

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

你只需要配置RemoteActorRefProvider(译者注：在最新版本的Akka中，只需设为`cluster`即可)。
这允许你在远程actor系统上部署actor，(并对远程actor进行)远程死亡观察、故障检测等。
虽然这很棒，但大多数场景下它太底层了，因为它需要确切知道正在协作的actor系统的远程地址。

## Akka Cluster

[Akka Cluster](https://blog.codecentric.de/en/2016/01/getting-started-akka-cluster/)在Akka Cluster的基础上提供了更高层的控制。
它由akka-cluster、akka-cluster-tools、akka-cluster-sharding等模块构成。
它的核心功能在于提供会员(membership)服务，允许actor系统加入和/或离开一个集群。
任何actor都可以监听集群事件(cluster events，例如MemberUp或MemberRemoved)，动态地了解潜在的远程通信方的情况。
一个分布式的故障检测器(failure detector)监控各个成员节点的健康，以提供当前集群状态的一致视图。
它可能宣布成员节点无法访问而触发UnreachableMember事件。

集群事件可以被直接使用，也可以通过更高层的特性被隐性地使用，例如：

- Cluster-aware routers：在远程成员节点上创建或查找routees。
- Cluster Singleton：保证在集群中某个actor只存在一个实例。
- Cluster Sharding：可以将大量actors分布在成员节点上。
- Distributed Data：基于[CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)的一致(consistent)数据复制，无需中央协调。

## Akka Persistence

Actor被重启的原因有很多，例如，程序掷出异常、硬件或网络故障(远程节点不可用)。
由于actor完全隐藏了内部状态，因此要想在重启后将actor恢复到原先状态，唯一的办法是向它发送和以前一样的消息。

显然，这很适合[Event Sourcing](https://www.martinfowler.com/eaaDev/EventSourcing.html)。
Akka Persistence正是通过Event Sourcing来恢复actor的状态。
Event Sourcing区分了命令(commands)和事件(events)。
一个persistent actor收到一个命令后，可能会创建一个事件，并要求Akka Persistence的日志(日志后端可能基于Cassandra或Kafka)将事件持久化。
一旦持久化被确认，它就将事件用于改变状态。
在复原过程中，所有的事件都会被重演，使得状态最终恢复如从前。
Akka Persistence也支持快照，避免因事件过多而导致复原耗时过长。

## Akka Streams and Akka HTTP

Akka Streams和Akka HTTP是实验性的模块，还不是"官方"Akka发行版的一部分(译者注：现在这两个模块已经十分成熟，属于Akka官方发行版的一部分)。

Reactive Streams约定如何通过非阻塞的back pressure来解决异步流处理中的问题。
Akka Streams、Reactor、RxJava、Slick和Vert.x是[Reactive Streams](http://www.reactive-streams.org/)的不同实现。
和前述Akka Cluster等模块一样，Akka Streams的实现也基于actors。

Akka Streams的一个完美用例是Akka HTTP，它是由非常成功的[spray项目](http://spray.io/)演化而来。
一个HTTP服务器接受一个HTTP请求流并产生一个HTTP响应流。
同时，HTTP entities的body基本上是一个甚至多个数据块，可以很好地表达为字节流。

## Conclusion

我们概述了Akka的几个模块。
最底层的Akka actors仅仅实现了actor模型，为Akka Cluster、Akka Persistence和Akka HTTP这样的高层抽象打下基础。
因此，每一个模块都具备actor模型的好处：松散耦合、可恢复性和弹性。

前文提到，我们正计划写一些后续文章，更深入地介绍各个模块。期待您的问题和反馈。
